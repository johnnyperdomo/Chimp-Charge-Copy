import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { User } from '../auth/user.model';
import { MerchantService } from '../merchants/merchants.service';
import { ChimpApiService } from '../shared/chimp-api.service';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  constructor(
    private merchantService: MerchantService,
    private chimpApi: ChimpApiService
  ) {}

  async handleStripeOAuthConnection(params: Params) {
    //successful queries
    const scope = await params.scope;
    const code = await params.code;

    //error queries
    const error = await params.error;
    const error_description = await params.error_description;

    if (error || error_description) {
      const errorMessage = `${error}: ${error_description}`;
      throw Error(errorMessage);
    }

    if (scope && code) {
      const body = {
        authorization_code: code,
      };

      try {
        const stripeOAuthResponse: any = await this.chimpApi.post(
          '/connect/connectStandardIntegration',
          body
        );
        const stripeConnectID =
          stripeOAuthResponse.authorization.stripe_user_id;

        this.merchantService.getMerchantInfo(stripeOAuthResponse.userID);
        return stripeConnectID;
      } catch (err) {
        throw Error(err.error.message);
      }
    }
    return null;
  }

  //Payment Links ==============================>
  async createPaymentLink(
    productIdempotencyKey: string,
    priceIdempotencyKey: string,
    amount: number,
    linkName: string,
    description: string,
    interval: string
  ) {
    const body = {
      productIdempotencyKey: productIdempotencyKey,
      priceIdempotencyKey: priceIdempotencyKey,
      amount: amount,
      productName: linkName,
      productDesc: description,
      interval: interval,
    };

    try {
      const createLink = await this.chimpApi.post(
        '/connect/onCreatePaymentLink',
        body
      );
      return createLink;
    } catch (err) {
      throw Error(err.error.message);
    }
  }

  async editPaymentLink(
    paymentLinkID: string,
    linkName: string,
    description: string
  ) {
    const body = {
      paymentLinkID: paymentLinkID,
      productName: linkName,
      productDesc: description,
    };

    try {
      const editLink = await this.chimpApi.patch(
        '/connect/onEditPaymentLink',
        body
      );
      return editLink;
    } catch (err) {
      throw Error(err.error.message);
    }
  }

  async deletePaymentLink(priceID: string, productID: string) {
    const body = {
      priceID: priceID,
      productID: productID,
    };

    try {
      const deleteLink = await this.chimpApi.patch(
        '/connect/onDeletePaymentLink',
        body
      );
      return deleteLink;
    } catch (err) {
      throw Error(err.error.message);
    }
  }
}
