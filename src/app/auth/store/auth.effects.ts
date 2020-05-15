import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthService } from '../auth.service';

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
        map((resData) => {
          let resToken: string = null;
          let resExpDate: string = null;

          // this.afAuth.idTokenResult.pipe(
          //   tap((tokenResult) => {
          //     resToken = tokenResult.token;
          //     resExpDate = tokenResult.expirationTime;
          //   })
          // );

          // resData.user
          //   .getIdTokenResult()
          //   .then((tokenResult) => {
          //     resToken = tokenResult.token;
          //   })
          //   .catch(() => {
          //     resToken = null;
          //   });

          return this.authService.handleAuthentication(
            resData.user.email,
            resData.user.uid,
            resToken,
            resExpDate
          );
        }),
        catchError((errorRes) => {
          return this.authService.handleError(errorRes);
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private afAuth: AngularFireAuth,
    private authService: AuthService
  ) {}
}
