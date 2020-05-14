import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { Action } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirebaseError } from 'firebase';
import { handleError } from '../auth-methods/handle-error';

const handleAuth = (resData: any) => {
  //TODO: handle auth
};

@Injectable()
export class AuthEffects {
  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START),
    switchMap((signupAction: AuthActions.SignupStart) => {
      return from(
        this.afAuth.createUserWithEmailAndPassword(
          signupAction.payload.email,
          signupAction.payload.password
        )
      ).pipe(
        tap((resData) => {
          //TODO: create auto logout
          console.log(resData);
        }),
        map((resData) => {
          //TODO: handle auth
          return { type: 'Dummy' };
        }),
        catchError((errorRes) => {
          return handleError(errorRes);
        })
      );
    })
  );

  constructor(private actions$: Actions, private afAuth: AngularFireAuth) {}
}
