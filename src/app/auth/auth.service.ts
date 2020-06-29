import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { FirebaseError } from 'firebase/app';
import * as AuthActions from './store/auth.actions';
import { User } from './user.model';
import * as fromApp from '../shared/app-store/app.reducer';
import { Store } from '@ngrx/store';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenExpTimer: any;

  constructor(
    private store: Store<fromApp.AppState>,
    private storage: LocalStorage
  ) {}

  //Auth ==================>

  handleError(errorRes: FirebaseError) {
    let errorMessage = 'An unknown error occurred. Please try again.';
    //if error is in a different format, maybe network error, we won't get from firebase
    if (!errorRes.code || !errorRes.message) {
      //throw default error
      return of(new AuthActions.AuthenticateFail(errorMessage));
    }

    switch (errorRes.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email. Please enter a valid email.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Weak password. Please enter a stronger password.';
        break;
      case 'auth/user-disabled':
        errorMessage =
          'This current account is disabled. Please contact support.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Login failed: Invalid username or password.';
        break;
      default:
        errorMessage = 'Unknown error. Please contact support.';
        break;
    }

    return of(new AuthActions.AuthenticateFail(errorMessage));
  }

  handleAuthentication(
    email: string,
    id: string,
    token: string,
    expirationTime: string,
    redirect: boolean
  ) {
    const authenticatedUser = new User(email, id, token, expirationTime);
    return new AuthActions.AuthenticateSuccess({
      user: authenticatedUser,
      redirect,
    });
  }

  async saveUserLocally(localUser: User) {
    return await this.storage
      .setItem('user', JSON.stringify(localUser))
      .pipe(first())
      .toPromise();
  }

  removeUserLocally() {
    this.storage.removeItem('user').subscribe((data) => {
      console.log('successfully removed user from local Storage: ' + data);
    });
  }

  async fetchUserLocally() {
    const asyncFetch = await this.storage
      .getItem('user')
      .pipe(first())
      .toPromise();

    if (!asyncFetch) {
      return null;
    }

    const user: {
      email: string;
      id: string;
      _token: string;
      _expirationDate: string;
    } = JSON.parse(String(asyncFetch));

    console.log('fetched async user: ' + user.email);

    return user;
  }

  //FUTURE-UPDATE: add auto logout message; maybe session expired how 'payhere' does it, and make user reauthenticate with firebase
  setAutoLogoutTimer(millisecondsToExpiration: number) {
    //can logout when token is set to expire
    this.tokenExpTimer = setTimeout(() => {
      this.store.dispatch(new AuthActions.Logout());
    }, millisecondsToExpiration);
  }

  clearLogoutTimer() {
    if (this.tokenExpTimer) {
      clearTimeout(this.tokenExpTimer);
      this.tokenExpTimer = null;
    }
  }
}
