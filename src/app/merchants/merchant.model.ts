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

//FUTURE-UPDATE: add businessName = null //make optional, user can add it later in accounts page, if businessname is null, show merchant name in checkout, else show business name

//TODO: things to add to model in firebase:
//TODO: add payment status
//TODO: membership type: yearly, monthly
