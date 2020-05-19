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
          //TODO: catch error
          return of();
        })
      );
    })
  );

  @Effect({ dispatch: false }) //TODO: dispatch to true
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
          //TODO: dispatch success; STRIPE

          const retrievedMerchant = this.merchantService.parseFirestoreMerchantData(
            merchantData.data()
          );

          return of();
        }),
        catchError((errorRes) => {
          //TODO: catch error
          return of();
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private merchantService: MerchantService
  ) {}
}
