import { Merchant } from '../merchant.model';
import * as MerchantActions from './merchant.actions';

export interface State {
  merchant: Merchant;
  error: string;
  loading: boolean;
}

const initialState: State = {
  merchant: null,
  error: null,
  loading: false,
};

export function merchantReducer(
  state = initialState,
  action: MerchantActions.MerchantActions
): State {
  switch (action.type) {
    case MerchantActions.GET_MERCHANT_INFO_SUCCESS:
      return {
        ...state,
        error: null,
        merchant: action.payload,
        loading: false,
      };
    case MerchantActions.GET_MERCHANT_INFO_START:
      return { ...state, error: null, loading: true };
    case MerchantActions.GET_MERCHANT_INFO_FAIL:
      return { ...state, error: action.payload, loading: false };
    case MerchantActions.SET_MERCHANT_INFO_SUCCESS:
      return {
        ...state,
        error: null,
        merchant: action.payload,
        loading: false,
      };
    case MerchantActions.SET_MERCHANT_INFO_START:
      return { ...state, error: null, loading: true };
    case MerchantActions.SET_MERCHANT_INFO_FAIL:
      return { ...state, error: action.payload, loading: false };
    default: {
      return state;
    }
  }
}
