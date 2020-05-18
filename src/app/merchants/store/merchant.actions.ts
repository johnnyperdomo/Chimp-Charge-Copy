import { Action } from '@ngrx/store';
import { Merchant } from '../merchant.model';

export const SET_MERCHANT_INFO_START = '[Merchant] Set Merchant Info Start';
export const SET_MERCHANT_INFO_SUCCESS = '[Merchant] Set Merchant Info Success';
export const SET_MERCHANT_INFO_FAIL = '[Merchant] Set Merchant Info Fail';
export const GET_MERCHANT_INFO_START = '[Merchant] Get Merchant Info Start';
export const GET_MERCHANT_INFO_SUCCESS = '[Merchant] Get Merchant Info Success';
export const GET_MERCHANT_INFO_FAIL = '[Merchant] Get Merchant Info Fail';

export class SetMerchantInfoStart implements Action {
  readonly type = SET_MERCHANT_INFO_START;

  constructor(public payload: Merchant) {}
}

export class SetMerchantInfoSuccess implements Action {
  readonly type = SET_MERCHANT_INFO_SUCCESS;

  constructor(public payload: Merchant) {}
}

export class SetMerchantInfoFail implements Action {
  readonly type = SET_MERCHANT_INFO_FAIL;

  constructor(public payload: string) {}
}

export class GetMerchantInfoStart implements Action {
  readonly type = GET_MERCHANT_INFO_START;

  constructor(public payload: Merchant) {}
}

export class GetMerchantInfoSuccess implements Action {
  readonly type = GET_MERCHANT_INFO_SUCCESS;

  constructor(public payload: Merchant) {}
}

export class GetMerchantInfoFail implements Action {
  readonly type = GET_MERCHANT_INFO_FAIL;

  constructor(public payload: string) {}
}

export type MerchantActions =
  | SetMerchantInfoStart
  | SetMerchantInfoSuccess
  | SetMerchantInfoFail
  | GetMerchantInfoStart
  | GetMerchantInfoSuccess
  | GetMerchantInfoFail;
