import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { User } from './auth/user.model';
import { MerchantService } from './merchants/merchants.service';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  constructor(
    private fireFunctions: AngularFireFunctions,
    private merchantService: MerchantService,
    private http: HttpClient,
    private auth: AngularFireAuth
  ) {}

  private chimpApiUrl = environment.chimpApiURL;

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
      const authHeader = await this.returnAuthHeader();

      const createLink = await this.http
        .post(this.chimpApiUrl + '/onCreatePaymentLink', body, {
          headers: authHeader,
        })
        .toPromise();

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
      const authHeader = await this.returnAuthHeader();

      const editLink = await this.http
        .post(this.chimpApiUrl + '/onEditPaymentLink', body, {
          headers: authHeader,
        })
        .toPromise();

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
      const authHeader = await this.returnAuthHeader();

      const deleteLink = await this.http
        .post(this.chimpApiUrl + '/onDeletePaymentLink', body, {
          headers: authHeader,
        })
        .toPromise();

      return deleteLink;
    } catch (err) {
      throw Error(err.error.message);
    }
  }

  //Helpers ==============================>
  private async returnAuthHeader() {
    //get user tokenId and pass into authorization header to validate on server

    try {
      const tokenId = (await (await this.auth.currentUser).getIdTokenResult())
        .token;

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenId}`,
      });

      return headers;
    } catch (err) {
      throw Error(err);
    }
  }
}
