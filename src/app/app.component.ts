import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as fromApp from './store/app.reducer';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth/store/auth.actions';
import { ActivatedRoute, Params } from '@angular/router';
import { HelperService } from './helper.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userSub: Subscription;
  querySub: Subscription;
  isStripeConnectUser: boolean = false;

  constructor(
    private store: Store<fromApp.AppState>,
    private route: ActivatedRoute,
    private helperService: HelperService
  ) {}

  ngOnInit() {
    this.autoLoginUser();

    this.querySub = this.route.queryParams.subscribe((query) => {
      this.handleStripePayload(query);
    });

    this.userSub = this.store
      .select('auth')
      .pipe(map((authState) => authState.user))
      .subscribe((user) => {
        this.isLoggedIn = !user ? false : true;
      });
  }

  //TODO: we may not need this function, check back later
  async handleStripePayload(query: Params) {
    try {
      const payload = await this.helperService.handleStripeOAuthConnection(
        query
      );

      if (payload) {
        console.log('yay from the app component, the user id is :' + payload);
      }
    } catch (err) {
      console.log(err);
    }
  }

  autoLoginUser() {
    this.store.dispatch(new AuthActions.AutoLogin());
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }

    if (this.querySub) {
      this.querySub.unsubscribe();
    }
  }
}
