import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { HelperService } from '../shared/helper.service';
import {
  ActivatedRoute,
  Router,
  NavigationStart,
  Event,
} from '@angular/router';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { Subject, Subscription } from 'rxjs';
import { User } from '../auth/user.model';
import { map, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stripeConnectClientID = environment.stripeConnectClientID;

  isLoggedIn: boolean = false;
  isCheckoutSession: boolean = false;

  currentUser = new Subject<User>();
  isStripeConnectAuthorized: boolean;

  userSub: Subscription;
  merchantSub: Subscription;
  currentUserSub: Subscription;
  routeSub: Subscription;

  constructor(
    private store: Store<fromApp.AppState>,
    private route: ActivatedRoute,
    private helperService: HelperService,
    private router: Router,
    private zone: NgZone //listens to some event handlers in observable to update ui
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
      }
    });

    this.userSub = this.store
      .select('auth')
      .pipe(map((authState) => authState.user))
      .subscribe((user) => {
        this.currentUser.next(user);
        this.isLoggedIn = !user ? false : true; //TODO: this isn't being called on new sign up, sometimes it does get called, could be that one function is not waiting for the other, figure this out.

        //TODO: if firebase get data error, 'connect alert' doesn't exist. => fix this
      });

    this.merchantSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((merchant) => {
        if (merchant) {
          this.zone.run(() => {
            this.isStripeConnectAuthorized = !merchant.stripeConnectID
              ? false
              : true;
          });
        }
      });

    // this.currentUserSub = this.currentUser
    //   .pipe(
    //     mergeMap((retrievedUser) => {
    //       return this.route.queryParams.pipe(
    //         map((query) => {
    //           this.handleStripePayload(query, retrievedUser);
    //         })
    //       );
    //     })
    //   )
    //   .subscribe();
  }

  // TODO: we may not need this function, check back later: with try: catch
  // async handleStripePayload(query: Params, retrievedUser: User) {
  //   if (!retrievedUser) {
  //     return;
  //   }

  //   try {
  //     const payload = await this.helperService.handleStripeOAuthConnection(
  //       query,
  //       retrievedUser
  //     );

  //     //TODO: trigger ui feedback for error or success
  //     if (payload) {
  //       console.log(' from the app component, the user id is :' + payload);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

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
  }
}
