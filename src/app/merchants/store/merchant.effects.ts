import { Injectable } from '@angular/core';
import { from, of } from 'rxjs';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as MerchantActions from '../store/merchant.actions';
import { switchMap, catchError, map, mergeMap } from 'rxjs/operators';
import { MerchantService } from '../merchants.service';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable()
export class MerchantEffects {
  @Effect({ dispatch: false }) // FIX: dispatch to true... can this cause a bug?
  setMerchantInfo = this.actions$.pipe(
    ofType(MerchantActions.SET_MERCHANT_INFO_START),
    mergeMap((merchant: MerchantActions.SetMerchantInfoStart) => {
      const parsedMerchant = JSON.parse(JSON.stringify(merchant.payload));
      return from(
        this.db
          .collection('merchants')
          .doc(merchant.payload.merchantUID)
          .set(parsedMerchant)
      ).pipe(
        catchError((errorRes) => {
          //FIX: handle error messages better like authService => 'Firestore Error'
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
        this.db.collection('merchants').doc(userId.payload).get()
      ).pipe(
        map((merchantData) => {
          const retrievedMerchant = this.merchantService.parseFirestoreMerchantData(
            merchantData.data()
          );

          return new MerchantActions.GetMerchantInfoSuccess(retrievedMerchant);
        }),
        catchError((errorRes) => {
          //FIX: handle error messages better like authService => 'Firestore Error'
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
    private merchantService: MerchantService,
    private db: AngularFirestore
  ) {}
}
