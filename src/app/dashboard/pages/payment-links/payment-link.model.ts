import { Stripe } from 'stripe';
import * as MoneyFormatter from 'src/app/shared/accounting';
import * as moment from 'moment';

export class PaymentLink {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public product: Stripe.Product;
  public price: Stripe.Price;
  public lastUpdated: Date;

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    product: Stripe.Product, //one-time vs recurring
    price: Stripe.Price,
    lastUpdated: Date
  ) {
    this.id = id;
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.product = product;
    this.price = price;
    this.lastUpdated = lastUpdated;
  }

  get created() {
    //product.created => Date()
    const createdDate = this.product.created; //unix epoch
    const formattedDate = moment.unix(createdDate).format('MMMM Do, YYYY');
    return formattedDate;
  }

  get linkType() {
    //one time, recurring
    if (this.price.type === 'one_time') {
      return 'one time';
    }

    return this.price.type;
  }

  get priceAmount() {
    //i.e. $350.00
    return MoneyFormatter.convertMinorUnitToStandard(this.price.unit_amount);
  }

  get billingInterval() {
    //i.e. Billed monthly
    const recurring = this.price.recurring;

    if (!recurring) {
      //if recurring is null, 'interval' won't exist => exit
      return;
    }

    const interval = recurring.interval;

    if (interval)
      switch (this.price.recurring.interval) {
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
