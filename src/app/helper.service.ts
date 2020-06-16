import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { User } from './auth/user.model';
import { MerchantService } from './merchants/merchants.service';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  constructor(
    private fireFunctions: AngularFireFunctions,
    private merchantService: MerchantService
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
      const stripeOAuthFunction = this.fireFunctions.httpsCallable(
        'connectStandardIntegration'
      );

      try {
        const responseToken = await stripeOAuthFunction({
          authorization_code: code,
        }).toPromise();

        const stripeConnectID = responseToken.stripe_user_id;

        this.merchantService.getMerchantInfo(user.id);

        return stripeConnectID;
      } catch (err) {
        console.log('error message is: ' + err);
        throw Error(err);
      }
    }
    return null;
  }

  async createPaymentLink(
    productIdempotencyKey: string,
    priceIdempotencyKey: string,
    amount: number,
    linkName: string,
    description: string,
    interval: string
  ) {
    const createLinkFunction = this.fireFunctions.httpsCallable(
      'paymentLinks-onCreatePaymentLink'
    );

    try {
      const createLink = await createLinkFunction({
        productIdempotencyKey: productIdempotencyKey,
        priceIdempotencyKey: priceIdempotencyKey,
        amount: amount,
        productName: linkName,
        productDesc: description,
        interval: interval,
      }).toPromise();

      console.log(createLink);

      return createLink;
    } catch (err) {
      console.log('error message is: ' + err);
      throw Error(err);
    }
  }

  //TODO:
  async editPaymentLink(
    paymentlinkID: string,
    linkName: string,
    description: string
  ) {
    //can only edit amount on 'one-time payments
    const editLinkFunction = this.fireFunctions.httpsCallable(
      'paymentLinks-onEditPaymentLink'
    );

    try {
      const editLink = await editLinkFunction({
        paymentlinkID: paymentlinkID,
        productName: linkName,
        productDesc: description,
      }).toPromise();

      return editLink;
    } catch (err) {
      throw Error(err);
    }
  }

  async deletePaymentLink(priceID: string, productID: string) {
    const deleteLinkFunction = this.fireFunctions.httpsCallable(
      'paymentLinks-onDeletePaymentLink'
    );

    try {
      const deleteLink = await deleteLinkFunction({
        priceID: priceID,
        productID: productID,
      }).toPromise();

      return deleteLink;
    } catch (err) {
      throw Error(err);
    }
  }
}
