export class Merchant {
  constructor(
    public firstName: string,
    public lastName: string,
    public businessName: string,
    public merchantUID: string,
    public connectID: string = null, //stripe connect account id
    public customerID: string = null, //stripe customer id
    public membership: any = null //{}
  ) {}
}
