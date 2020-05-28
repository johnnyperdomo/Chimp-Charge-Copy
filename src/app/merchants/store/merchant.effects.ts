import { Injectable } from '@angular/core';
import { from, of } from 'rxjs';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as MerchantActions from '../store/merchant.actions';
import { switchMap, catchError, map } from 'rxjs/operators';
import * as firebaseApp from 'firebase/app';
import { MerchantService } from '../merchants.service';

@Injectable()
export class MerchantEffects {
  @Effect({ dispatch: false }) //TODO: dispatch to true
  setMerchantInfo = this.actions$.pipe(
    ofType(MerchantActions.SET_MERCHANT_INFO_START),
    switchMap((merchant: MerchantActions.SetMerchantInfoStart) => {
      const parsedMerchant = JSON.parse(JSON.stringify(merchant.payload));
      return from(
        firebaseApp
          .firestore()
          .collection('merchants')
          .doc(merchant.payload.uid)
          .set(parsedMerchant, { merge: true })
      ).pipe(
        map((merchant) => {
          //TODO: dispatch success.then (if stripe billing ids exist, call billing) //STRIPE
          return of();
        }),
        catchError((errorRes) => {
          //NEXT-UPDATE: handle error messages better like authService => 'Firestore Error'
          return of(
            new MerchantActions.SetMerchantInfoFail('Error: Please try again.')
          );
        })
      );
    })
  );

  @Effect()
  getMerchantInfo = this.actions$.pipe(
    ofType(MerchantActions.GET_MERCHANT_INFO_START),
    switchMap((userId: MerchantActions.GetMerchantInfoStart) => {
      return from(
        firebaseApp
          .firestore()
          .collection('merchants')
          .doc(userId.payload)
          .get()
      ).pipe(
        map((merchantData) => {
          const retrievedMerchant = this.merchantService.parseFirestoreMerchantData(
            merchantData.data()
          );
          return new MerchantActions.GetMerchantInfoSuccess(retrievedMerchant);
        }),
        catchError((errorRes) => {
          //NEXT-UPDATE: handle error messages better like authService => 'Firestore Error'
          //https://firebase.google.com/docs/reference/js/firebase.firestore#firestoreerrorcode
          return of(
            new MerchantActions.GetMerchantInfoFail('Error: Please try again.')
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private merchantService: MerchantService
  ) {}
}
