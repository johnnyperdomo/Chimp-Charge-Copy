import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { FirebaseError } from 'firebase';
import * as AuthActions from './store/auth.actions';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

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
}
