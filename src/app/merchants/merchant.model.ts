import { MembershipFieldInterface } from '../shared/interfaces';

export class Merchant {
  constructor(
    public firstName: string,
    public lastName: string,
    public businessName: string,
    public merchantUID: string,
    public connectID: string = null, //stripe connect account id
    public customerID: string = null, //stripe customer id
    public membership: MembershipFieldInterface = null, //{}

    // Schema Version 2.1.0 //
    //TODO: do all of this in a new branch not here
    //TODO: have a 'type' for currencies
    public defaultCurrency: string = 'usd' //≈
  ) {}
}

//LATER: have 'private' sub collection, for api keys and stuff.