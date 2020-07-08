import * as moment from 'moment';
import {
  CustomerFieldInterface,
  TransactionsInterface,
} from 'src/app/shared/interfaces';
import * as MoneyFormatter from 'src/app/shared/accounting';

export class Customer {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public transactions: TransactionsInterface;
  public activeSubscriptionsCount: number;
  public customer: CustomerFieldInterface;
  public lastUpdated: Date;
  //FUTURE-UPDATE: active subs, isdeleted,transactions

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    transactions: TransactionsInterface,
    activeSubscriptionsCount: number,
    customer: CustomerFieldInterface,
    lastUpdated: Date
  ) {
    this.id = id;
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.transactions = transactions;
    this.activeSubscriptionsCount = activeSubscriptionsCount;
    this.customer = customer;
    this.lastUpdated = lastUpdated;
  }

  get created() {
    //product.created => Date()
    const createdDate = this.customer.created; //unix epoch
    const formattedDate = moment.unix(createdDate).format('MMMM Do, YYYY');
    return formattedDate;
  }

  get isSubscriber() {
    //check to see if customer is a subscriber of any subscription
    return this.activeSubscriptionsCount > 0 ? true : false;
  }

  get successfulAmount() {
    //FUTURE-UPDATE: take into account refunded payments

    //calculated amount of all transactions => $937.54
    return MoneyFormatter.convertMinorUnitToStandard(
      this.transactions && this.transactions.successfulAmount
    );
  }
}
