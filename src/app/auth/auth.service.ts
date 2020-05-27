import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { FirebaseError } from 'firebase/app';
import * as AuthActions from './store/auth.actions';
import { User } from './user.model';
import * as fromApp from '../store/app.reducer';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenExpTimer: any;

  constructor(private store: Store<fromApp.AppState>) {}

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
      //TODO: test the error messages below in a login session
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

  saveUserLocally(localUser: User) {
    localStorage.setItem('user', JSON.stringify(localUser));
  }

  removeUserLocally() {
    localStorage.removeItem('user');
  }

  fetchUserLocally() {
    const fetchedUser: {
      email: string;
      id: string;
      _token: string;
      _expirationDate: string;
    } = JSON.parse(localStorage.getItem('user'));

    console.log('fetched user', fetchedUser);

    return fetchedUser;
  }

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

//TODO: auto login
