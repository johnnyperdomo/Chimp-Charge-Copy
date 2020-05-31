import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { switchMap, catchError, map, tap, mergeMap } from 'rxjs/operators';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { User } from '../user.model';
import { MerchantService } from 'src/app/merchants/merchants.service';
import { Merchant } from 'src/app/merchants/merchant.model';

let userFirstName: string = null;
let userLastName: string = null;

@Injectable()
export class AuthEffects {
  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START),
    switchMap((signupAction: AuthActions.SignupStart) => {
      userFirstName = signupAction.payload.firstName;
      userLastName = signupAction.payload.lastName;
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
                tokenresult.expirationTime,
                true
              );
            })
          );
        }),
        tap((resData) => {
          const newMerchant = new Merchant(
            userFirstName,
            userLastName,
            resData.payload.user.id
          );
          this.merchantService.setMerchantInfo(newMerchant);
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
                tokenresult.expirationTime,
                true
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
    tap(async (authSuccessAction: AuthActions.AuthenticateSuccess) => {
      if (
        authSuccessAction.payload.user &&
        authSuccessAction.payload.redirect === true
      ) {
        await this.authService.saveUserLocally(authSuccessAction.payload.user);
        this.authService.setAutoLogoutTimer(
          authSuccessAction.payload.user.expiresInMilliseconds
        );
        this.router.navigate(['/payments']);
      }
    }),
    tap((authSuccessAction: AuthActions.AuthenticateSuccess) => {
      this.merchantService.getMerchantInfo(authSuccessAction.payload.user.id);
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
      this.authService.removeUserLocally();
      this.router.navigate(['/login']); //redirects when user logs out
    })
  );

  @Effect()
  autoLogin = this.actions$.pipe(
    ofType(AuthActions.AUTO_LOGIN),
    switchMap(() => {
      return from(this.authService.fetchUserLocally());
    }),
    map((currentLocalStorageUser) => {
      if (!currentLocalStorageUser) {
        return { type: 'null' }; //pseudo: no user
      }

      const loadedUser = new User(
        currentLocalStorageUser.email,
        currentLocalStorageUser.id,
        currentLocalStorageUser._token,
        currentLocalStorageUser._expirationDate
      );

      if (loadedUser.isTokenValid) {
        this.authService.setAutoLogoutTimer(loadedUser.expiresInMilliseconds);

        return new AuthActions.AuthenticateSuccess({
          user: loadedUser,
          redirect: false,
        });
      } else {
        //if token invalid, logout
        return new AuthActions.Logout();
      }
    })
  );

  constructor(
    private actions$: Actions,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private router: Router,
    private merchantService: MerchantService
  ) {}
}
