export class Merchant {
  constructor(
    public firstName: string,
    public lastName: string,
    public uid: string,
    public stripeBillingID: string = null,
    public stripeConnectID: string = null
  ) {}
}
