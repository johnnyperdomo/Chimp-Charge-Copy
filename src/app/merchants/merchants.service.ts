import { Injectable } from '@angular/core';
import * as fromApp from '../store/app.reducer';
import { Store } from '@ngrx/store';
import * as MerchantActions from '../merchants/store/merchant.actions';
import { Merchant } from './merchant.model';

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  constructor(private store: Store<fromApp.AppState>) {}

  setMerchantInfo(user: Merchant) {
    this.store.dispatch(new MerchantActions.SetMerchantInfoStart(user));
  }
}
