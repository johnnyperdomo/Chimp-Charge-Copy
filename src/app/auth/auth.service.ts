import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { FirebaseError } from 'firebase';
import * as AuthActions from './store/auth.actions';
import { User } from './user.model';
import { AngularFireAuth } from '@angular/fire/auth';
import * as angFire from 'firebase';
import { first, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(public afAuth: AngularFireAuth) {}

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

    console.log(errorMessage);

    return of(new AuthActions.AuthenticateFail(errorMessage));
  }

  handleAuthentication(
    email: string,
    id: string,
    token: string,
    expirationTime: string
  ) {
    const newUser = new User(email, id, token, expirationTime);
    return new AuthActions.AuthenticateSuccess({ user: newUser });
  }

  async saveUserLocally() {
    const token = await (await this.afAuth.currentUser).getIdTokenResult(); //await, wait for it to finish
    const user = await this.afAuth.currentUser;

    if (token && user) {
      const userData = {
        email: user.email,
        id: user.uid,
        token: token.token,
        expirationTime: token.expirationTime,
      };
      console.log(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }

  //TODO: auto login

  //TODO: auto logout
}
