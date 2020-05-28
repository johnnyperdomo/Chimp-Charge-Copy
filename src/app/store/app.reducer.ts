import * as fromAuth from '../auth/store/auth.reducer';
import * as fromMerchant from '../merchants/store/merchant.reducer';
import { ActionReducerMap } from '@ngrx/store';

export interface AppState {
  auth: fromAuth.State;
  merchant: fromMerchant.State;
}

//structure in cleaner way, all the states of teh entire app
export const appReducer: ActionReducerMap<AppState> = {
  auth: fromAuth.authReducer,
  merchant: fromMerchant.merchantReducer,
};
