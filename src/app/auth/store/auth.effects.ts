import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { switchMap, catchError, map, tap, mergeMap } from 'rxjs/operators';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

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
        mergeMap((resData) => {
          return this.afAuth.idTokenResult.pipe(
            map((tokenresult) => {
              return this.authService.handleAuthentication(
                resData.user.email,
                resData.user.uid,
                tokenresult.token,
                tokenresult.expirationTime
              );
            })
          );
        }),
        catchError((errorRes) => {
          return this.authService.handleError(errorRes);
        })
      );
    })
  );

  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((loginAction: AuthActions.LoginStart) => {
      return from(
        this.afAuth.signInWithEmailAndPassword(
          loginAction.payload.email,
          loginAction.payload.password
        )
      ).pipe(
        mergeMap((resData) => {
          return this.afAuth.idTokenResult.pipe(
            map((tokenresult) => {
              return this.authService.handleAuthentication(
                resData.user.email,
                resData.user.uid,
                tokenresult.token,
                tokenresult.expirationTime
              );
            })
          );
        }),
        catchError((errorRes) => {
          return this.authService.handleError(errorRes);
        })
      );
    })
  );

  @Effect({ dispatch: false })
  authSuccess = this.actions$.pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS),
    tap((authSuccessAction: AuthActions.AuthenticateSuccess) => {
      if (authSuccessAction.payload.user) {
        //TODO: add auto login functionality; add auto logout timer

        this.authService.saveUserLocally(authSuccessAction.payload.user);
        // this.authService.setAutoLogoutTimer(3000);
        this.router.navigate(['/payments']);
      }
    })
  );

  @Effect({ dispatch: false })
  authLogout = this.actions$.pipe(
    ofType(AuthActions.LOGOUT),
    switchMap(() => {
      return from(this.afAuth.signOut());
    }),
    tap(() => {
      this.authService.clearLogoutTimer();
      localStorage.removeItem('userData');
      console.log('user logged out');

      this.router.navigate(['/login']); //redirects when user logs out
    })
  );

  //TODO: auto login

  constructor(
    private actions$: Actions,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private router: Router
  ) {}
}
