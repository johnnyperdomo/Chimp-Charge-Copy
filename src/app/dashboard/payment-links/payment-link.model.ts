//TODO: pseudo code
//TODO: use firebase model:
// price: Stripe.Price {}
// product: Stripe.Product
import { Stripe } from 'stripe';

export class PaymentLink {
  public id: string;
  public merchantUID: string;
  public product: Stripe.Product;
  public price: Stripe.Price;
  public lastUpdated: Date;

  constructor(
    id: string,
    merchantUID: string,
    product: Stripe.Product, //one-time vs recurring
    price: Stripe.Price,
    lastUpdated: Date //TODO: should be date
  ) {
    this.id = id;
    this.merchantUID = merchantUID;
    this.product = product;
    this.price = price;
    this.lastUpdated = lastUpdated;
  }

  get created() {
    //product.created => Date()
    //TODO: use moment js to parse date
    return 'June 17, 2020'; //
  }

  get linkType() {
    //one time, recurring
    return this.price.type;
  }

  get priceAmount() {
    //i.e. $350.00
    return this.price.unit_amount; //TODO: parse using dinero.js
  }

  get billingInterval() {
    //i.e. monthly
    return this.price.recurring.interval; //TODO:
  }
}
