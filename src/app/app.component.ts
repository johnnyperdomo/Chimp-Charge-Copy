import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import * as fromApp from './store/app.reducer';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth/store/auth.actions';
import {
  ActivatedRoute,
  Params,
  Router,
  Event,
  NavigationStart,
} from '@angular/router';
import { HelperService } from './helper.service';
import { environment } from 'src/environments/environment';
import { User } from './auth/user.model';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
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

  ngOnInit() {
    this.autoLoginUser();

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
        this.isLoggedIn = !user ? false : true; //TODO: this isn't being called on new sign up
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

    this.currentUserSub = this.currentUser
      .pipe(
        mergeMap((retrievedUser) => {
          return this.route.queryParams.pipe(
            map((query) => {
              this.handleStripePayload(query, retrievedUser);
            })
          );
        })
      )
      .subscribe();
  }

  // TODO: we may not need this function, check back later: with try: catch
  async handleStripePayload(query: Params, retrievedUser: User) {
    if (!retrievedUser) {
      return;
    }

    try {
      const payload = await this.helperService.handleStripeOAuthConnection(
        query,
        retrievedUser
      );

      //TODO: trigger ui feedback for error or success
      if (payload) {
        console.log(' from the app component, the user id is :' + payload);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async autoLoginUser() {
    this.store.dispatch(new AuthActions.AutoLogin());
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
  }
}

//TODO: make all 'lists' text wrapper for long texts
//TODO: maybe create unix epoch to human redable format using 'moment'. for firebase timestamp

//FUTURE-UPDATE: fix firebase query reads; make sure app doesn't query on each component load, but does so one time, and can also from ngrx store to load this instead on the component. Maybee load a limited amount of most recent data once on initial app.comp.ts load, and then only fetch new data on pagination change, or on individual snapshot changes. i.e, limit => 10 of the most recent transactions.(don't want to get unnecesary needs user won't read)

//FUTURE-UPDATE: add pagination controls on front end, so don't present too much data to user which becomes overwhelming. Get all data first from server, manipuulate on client side

//FUTURE-UPDATE: work on making app responsive on different screen sizes.

//FUTURE-UPDATE: create reducers for all components, for better, single one source of truth

//FUTURE-UPDATE: get all ngoninit observables and add them in a separate function to make code cleaner

//FUTURE-UPDATE: listen for angFire auth state changes, if auth state logs out, call logout ngrx action. right now, if auth state changes, logout may not be called sometimes. (to replicate )
