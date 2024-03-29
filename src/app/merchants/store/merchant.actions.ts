import { Action } from '@ngrx/store';
import { Merchant } from '../merchant.model';

//Merchant Metadata =======================================>

//set - create items remotely, then push to store
export const SET_MERCHANT_INFO_START = '[Merchant] Set Merchant Info Start';
export const SET_MERCHANT_INFO_SUCCESS = '[Merchant] Set Merchant Info Success';
export const SET_MERCHANT_INFO_FAIL = '[Merchant] Set Merchant Info Fail';
//get - retrieve items from firebase then add to store
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

  constructor(public payload: string) {} //error message
}

export class GetMerchantInfoStart implements Action {
  readonly type = GET_MERCHANT_INFO_START;

  constructor(public payload: string) {} //uid
}

export class GetMerchantInfoSuccess implements Action {
  readonly type = GET_MERCHANT_INFO_SUCCESS;

  constructor(public payload: Merchant) {}
}

export class GetMerchantInfoFail implements Action {
  readonly type = GET_MERCHANT_INFO_FAIL;

  constructor(public payload: string) {} //error message
}

export type MerchantActions =
  | SetMerchantInfoStart
  | SetMerchantInfoSuccess
  | SetMerchantInfoFail
  | GetMerchantInfoStart
  | GetMerchantInfoSuccess
  | GetMerchantInfoFail;
