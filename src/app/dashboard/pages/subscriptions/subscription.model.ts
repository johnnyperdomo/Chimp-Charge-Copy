import {
  SubscriptionFieldInterface,
  CustomerFieldInterface,
  PaymentLinkFieldInterface,
} from 'src/app/shared/interfaces';
import * as MoneyFormatter from 'src/app/shared/accounting';
import * as moment from 'moment';
import Stripe from 'stripe';

export class Subscription {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public customer: CustomerFieldInterface;
  public status: Stripe.Subscription.Status;
  public paymentLink: PaymentLinkFieldInterface;
  public subscription: SubscriptionFieldInterface;
  public lastUpdated: Date;

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    customer: CustomerFieldInterface,
    status: Stripe.Subscription.Status,
    paymentLink: PaymentLinkFieldInterface,
    subscription: SubscriptionFieldInterface,
    lastUpdated: Date
  ) {
    this.id = id;
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.customer = customer;
    this.status = status;
    this.paymentLink = paymentLink;
    this.subscription = subscription;
    this.lastUpdated = lastUpdated;
  }

  get created() {
    //product.created => Date()
    const createdDate = this.subscription.created; //unix epoch
    const formattedDate = moment.unix(createdDate).format('MMMM Do, YYYY');
    return formattedDate;
  }

  get linkAmount() {
    //i.e. $350.00
    return MoneyFormatter.convertMinorUnitToStandard(this.paymentLink.amount);
  }

  get isCancelled() {
    if (this.status === 'canceled') {
      return true;
    }
    return false;
  }

  get billingInterval() {
    //i.e. Billed monthly
    const interval = this.paymentLink.billingInterval;

    if (!interval) {
      //if recurring is null, 'interval' won't exist => exit
      return;
    }

    if (interval)
      switch (interval) {
        case 'day':
          return 'Daily';
        case 'month':
          return 'Monthly';
        case 'week':
          return 'Weekly';
        case 'year':
          return 'Yearly';
        default:
          return;
      }

    return;
  }
}
