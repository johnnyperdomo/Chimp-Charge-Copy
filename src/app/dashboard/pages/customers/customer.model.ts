import * as moment from 'moment';

export class Customer {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public customer: customerFieldType;
  public lastUpdated: Date;
  //FUTURE-UPDATE: active subs, isdeleted,transactions

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    customer: customerFieldType,
    lastUpdated: Date
  ) {
    this.id = id;
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.customer = customer;
    this.lastUpdated = lastUpdated;
  }

  get created() {
    //product.created => Date()
    const createdDate = this.customer.created; //unix epoch
    const formattedDate = moment.unix(createdDate).format('MMMM Do, YYYY');
    return formattedDate;
  }
}

interface customerFieldType {
  created: number; //unix
  customerID: string;
  email: string;
  name: string;
}
