import { FirebaseError } from 'firebase';
import { of } from 'rxjs';
import * as AuthActions from '../store/auth.actions';

export const handleError = (errorRes: FirebaseError) => {
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
    default:
      errorMessage = 'Unknown error. Please contact support.';
      break;

    //TODO: create error messages for login session
  }
  return of(new AuthActions.AuthenticateFail(errorMessage));
};
