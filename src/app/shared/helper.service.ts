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

  async handleStripeOAuthConnection(query: Params, user: User) {
    //TODO: If user gets back response from helper function, clear url parameters

    //TODO: add loading spinner so user can know you're waiting on a response, until await finished
    //TODO: handle different error cases

    //successful queries
    const scope = await query.scope;
    const code = await query.code;

    //error queries
    const error = await query.error;
    const error_description = await query.error_description;

    if (error || error_description) {
      //TODO: trigger alert => authentication failed, try again
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
        const stripeConnectID = stripeOAuthResponse.stripe_user_id;

        this.merchantService.getMerchantInfo(user.id);
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
