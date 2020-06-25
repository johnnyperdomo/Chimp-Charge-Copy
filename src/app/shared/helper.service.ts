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
    productName: string,
    productDesc: string,
    interval: string
  ) {
    const body = {
      productIdempotencyKey,
      priceIdempotencyKey,
      amount,
      productName,
      productDesc,
      interval,
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
    productName: string,
    productDesc: string
  ) {
    const body = {
      paymentLinkID,
      productName,
      productDesc,
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

  //Checkout ==============================>

  //for one_time payment. 'clientSecret' generated on server, but payment confirmed on client
  async createPaymentIntent(
    amount: number,
    customerParams: { email: string; name: string },
    connectID: string,
    merchantUID: string
  ) {
    const body = {
      amount,
      customerParams,
      connectID,
      merchantUID,
    };

    try {
      //non-authenticated customer checkout
      const paymentIntent = await this.chimpApi.post(
        '/connect/createPaymentIntent',
        body,
        false
      );
      console.log('payment intenttttttt helper: ', paymentIntent);

      return paymentIntent;
    } catch (err) {
      throw Error(err.error.message);
    }
  }
}
