import { Injectable } from '@angular/core';
import * as fromApp from '../store/app.reducer';
import { Store } from '@ngrx/store';
import * as MerchantActions from '../merchants/store/merchant.actions';
import { Merchant } from './merchant.model';
import * as firebaseApp from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  constructor(private store: Store<fromApp.AppState>) {}

  setMerchantInfo(user: Merchant) {
    this.store.dispatch(new MerchantActions.SetMerchantInfoStart(user));
  }

  getMerchantInfo(userId: string) {
    this.store.dispatch(new MerchantActions.GetMerchantInfoStart(userId));
  }

  parseFirestoreMerchantData(
    data: firebaseApp.firestore.DocumentData
  ): Merchant {
    const parsedMerchant = new Merchant(
      data.firstName,
      data.lastName,
      data.uid,
      data.stripeBillingID,
      data.stripeConnectID
    );

    return parsedMerchant;
  }
}
