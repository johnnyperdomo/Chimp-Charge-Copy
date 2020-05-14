import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { Action } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirebaseError } from 'firebase';

const handleError = (errorRes: FirebaseError) => {
  //TODO: get error data
  console.log(
    `error code: ${errorRes.code}, error Message: ${errorRes.message}`
  );
  return of(new AuthActions.AuthenticateFail(errorRes.message));
};

@Injectable()
export class AuthEffects {
  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START),
    switchMap((signupAction: AuthActions.SignupStart) => {
      return from(
        this.fbAuth.createUserWithEmailAndPassword(
          signupAction.payload.email,
          signupAction.payload.password
        )
      ).pipe(
        tap((resData) => {
          console.log(resData);
        }),
        catchError((errorRes) => {
          return handleError(errorRes);
        })
      );
    })
  );

  constructor(private actions$: Actions, private fbAuth: AngularFireAuth) {}
}
