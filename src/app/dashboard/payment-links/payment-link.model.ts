//TODO: pseudo code
//TODO: use firebase model:
// price: Stripe.Price {}
// product: Stripe.Product

export class PaymentLink {
  public id: string;
  public linkName: string;
  public type: string;
  public price: string;
  public createdDate: string;

  constructor(
    id: string,
    linkName: string,
    type: string, //one-time vs recurring
    price: string,
    createdDate: string //TODO: should be date
  ) {
    this.id = id;
    this.linkName = linkName;
    this.type = type;
    this.price = price;
    this.createdDate = createdDate;
  }
}
