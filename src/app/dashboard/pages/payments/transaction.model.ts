import * as moment from 'moment';
import {
  CustomerFieldInterface,
  PaymentIntentFieldInterface,
} from 'src/app/shared/interfaces';
import * as MoneyFormatter from 'src/app/shared/accounting';
import Stripe from 'stripe';

export class Transaction {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public paymentIntent: PaymentIntentFieldInterface;
  public originalCustomer: CustomerFieldInterface; //the original customer information at time of transaction
  public upToDateCustomer: CustomerFieldInterface;
  public productID: string;
  public productName: string;
  public isRefunded: boolean;
  public lastUpdated: Date;
  //TODO: upTODateCustomer
  //LATER: //isdisputed

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    paymentIntent: PaymentIntentFieldInterface,
    originalCustomer: CustomerFieldInterface,
    upToDateCustomer: CustomerFieldInterface,
    productID: string,
    productName: string,
    isRefunded: boolean,
    lastUpdated: Date
  ) {
    (this.id = id),
      (this.merchantUID = merchantUID),
      (this.connectID = connectID),
      (this.paymentIntent = paymentIntent),
      (this.originalCustomer = originalCustomer),
      (this.upToDateCustomer = upToDateCustomer),
      (this.productID = productID),
      (this.productName = productName),
      (this.isRefunded = isRefunded),
      (this.lastUpdated = lastUpdated);
  }

  get created() {
    //product.created => Date()
    const createdDate = this.paymentIntent.created; //unix epoch
    const formattedDate = moment.unix(createdDate).format('MMMM Do, YYYY');
    return formattedDate;
  }

  get transactionType() {
    if (this.paymentIntent.invoiceID) {
      return 'recurring';
    }
    return 'one time';
  }

  get status() {
    if (this.isRefunded === true) {
      return 'Refunded';
    }
    return 'Succeeded';
  }

  get shortTxnID() {
    //truncated id of paymentIntentID
    return this.paymentIntent.paymentIntentID.slice(-6); //last 6 characters
  }

  get amount() {
    //i.e. $350.00
    //LATER: take into account refunded payments

    return MoneyFormatter.convertMinorUnitToStandard(this.paymentIntent.amount);
  }
}
