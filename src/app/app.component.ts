import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import * as fromApp from './store/app.reducer';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth/store/auth.actions';
import { ActivatedRoute, Params } from '@angular/router';
import { HelperService } from './helper.service';
import { environment } from 'src/environments/environment';
import { User } from './auth/user.model';
import { NgZone } from '@angular/core';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  stripeConnectClientID = environment.stripeConnectClientID;

  isLoggedIn: boolean = false;
  currentUser = new Subject<User>();
  isStripeConnectAuthorized: boolean;

  userSub: Subscription;
  merchantSub: Subscription;
  querySub: Subscription;

  constructor(
    private store: Store<fromApp.AppState>,
    private route: ActivatedRoute,
    private helperService: HelperService,
    private zone: NgZone //listens to some event handlers in observable to update ui
  ) {}

  ngOnInit() {
    this.autoLoginUser();

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
            this.isStripeConnectAuthorized = !merchant.stripeConnectID
              ? false
              : true;
          });
        }
      });

    this.currentUser
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

    if (this.querySub) {
      this.querySub.unsubscribe();
    }

    if (this.merchantSub) {
      this.merchantSub.unsubscribe();
    }
  }

  //NEXT-UPDATE: add pagination controls on front end, so don't present too much data to user which becomes overwhelming. Get all data first from server, manipuulate on client side

  //NEXT-UPDATE: create reducers for all components, for better, single one source of truth

  //TODO: maybe create unix epoch to human redable format using 'moment'. for firebase timestamp
}
