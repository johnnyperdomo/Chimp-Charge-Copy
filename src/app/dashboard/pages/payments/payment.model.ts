import * as moment from 'moment';
import {
  CustomerFieldInterface,
  PaymentIntentFieldInterface,
} from 'src/app/shared/interfaces';
import * as MoneyFormatter from 'src/app/shared/accounting';

export class Payment {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public paymentIntent: PaymentIntentFieldInterface;
  public customer: CustomerFieldInterface;
  public productID: string;
  public productName: string;
  public isRefunded: boolean;
  public lastUpdated: Date;
  //FUTURE-UPDATE: //isdisputed

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    paymentIntent: PaymentIntentFieldInterface,
    customer: CustomerFieldInterface,
    productID: string,
    productName: string,
    isRefunded: boolean,
    lastUpdated: Date
  ) {
    (this.id = id),
      (this.merchantUID = merchantUID),
      (this.connectID = connectID),
      (this.paymentIntent = paymentIntent),
      (this.customer = customer),
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
    return MoneyFormatter.convertMinorUnitToStandard(this.paymentIntent.amount);
  }
}
