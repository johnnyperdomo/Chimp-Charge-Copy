export class Merchant {
  constructor(
    public firstName: string,
    public lastName: string,
    public uid: string,
    public stripeBillingID: string = null,
    public stripeConnectID: string = null
  ) {}
}
//TODO: things to add to model in firebase:
//TODO: add payment status
//TODO: membership type: yearly, monthly
