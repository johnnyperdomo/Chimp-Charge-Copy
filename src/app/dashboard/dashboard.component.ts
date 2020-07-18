import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationStart, Event } from '@angular/router';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { Subscription, BehaviorSubject } from 'rxjs';
import { User } from '../auth/user.model';
import { map, filter, mergeMap } from 'rxjs/operators';
import { Merchant } from '../merchants/merchant.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { MerchantService } from '../merchants/merchants.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isCheckoutSession: boolean = false;
  isStripeOAuthConnecting: boolean = false;

  currentUser = new BehaviorSubject<User>(null);
  isStripeConnectAuthorized: boolean;

  userSub: Subscription;
  merchantSub: Subscription;
  currentUserSub: Subscription;
  routeSub: Subscription;
  merchantDocSubscription: Subscription;

  constructor(
    private store: Store<fromApp.AppState>,
    private router: Router,
    private db: AngularFirestore,
    private merchantService: MerchantService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.routeSub = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        let path = event.url;

        //i.e. '/pay/1234' => checkout session
        if (path.includes('/pay/')) {
          this.isCheckoutSession = true;
        } else {
          this.isCheckoutSession = false;
        }

        //user is connecting to stripOAuth flow
        if (path.includes('/connect-redirect')) {
          this.isStripeOAuthConnecting = true;
        } else {
          this.isStripeOAuthConnecting = false;
        }
      }
    });

    this.userSub = this.store
      .select('auth')
      .pipe(map((authState) => authState.user))
      .subscribe((user) => {
        this.currentUser.next(user);
        this.isLoggedIn = !user ? false : true;
      });

    this.merchantSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((merchant) => {
        if (merchant) {
          this.zone.run(() => {
            this.isStripeConnectAuthorized = !merchant.connectID ? false : true;
          });
        }
      });

    // FIX: this merchant sub is fired 3 times, on app load. which causes all other merchant subs to be fired 3 times where this ngstore is subscribed to.
    this.merchantDocSubscription = this.currentUser
      .pipe(
        filter((user) => user !== null),
        mergeMap((user) => {
          return this.db.doc<Merchant>(`merchants/${user.id}`).valueChanges();
        })
      )
      .subscribe((merchant) => {
        // TODO: listen to merchant sub in paywall component
        this.merchantService.getMerchantInfo(merchant.merchantUID);
      });
  }

  openStripeOAuthFlow() {
    const currentURL = location.origin;
    const redirectURL = currentURL + '/connect-redirect';
    window.open(redirectURL, '_blank');
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }

    if (this.currentUserSub) {
      this.currentUserSub.unsubscribe();
    }

    if (this.merchantSub) {
      this.merchantSub.unsubscribe();
    }

    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }

    if (this.merchantDocSubscription) {
      this.merchantDocSubscription.unsubscribe();
    }
  }
}

//FIX: on app reload, on payments page, array of firestore data is called multiple times, not supposed to happen. looks like 3 times to me. Fix this

//FIX: when i log out user, and then i log into another user account. the previous user's firestore info is not immediately removed. Make sure all objects are emptied from client side on logout. so that this doesn't happen. Maybe clear objects on ng destroy?

//FIX: when user logouts, ngrx merchant data seems to still be intact and listening to firestore documents, so if new user logs in, it listens to the previous users merchant data. this should not be the case. everything should be reset back to 0, like if no one had ever logged in.

// LATER: make bootstrap containers container-fluid when needed, to have the objects resize with the screen, and not only on breakpoints
