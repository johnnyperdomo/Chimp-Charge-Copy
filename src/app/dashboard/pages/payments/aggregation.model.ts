import {
  SubscriptionsInterface,
  TransactionsInterface,
} from 'src/app/shared/interfaces';
import * as MoneyFormatter from 'src/app/shared/accounting';

//aggregation map, quick stats on connect data
export class Aggregation {
  public id: string;
  public merchantUID: string;
  public connectID: string;
  public customerCount: number;
  public subscriptions: SubscriptionsInterface;
  public transactions: TransactionsInterface;
  //FUTURE-UPDATE: paymentLinkCount

  constructor(
    id: string,
    merchantUID: string,
    connectID: string,
    customerCount: number,
    subscriptions: SubscriptionsInterface,
    transactions: TransactionsInterface
  ) {
    this.id = id;
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.customerCount = customerCount;
    this.subscriptions = subscriptions;
    this.transactions = transactions;
  }
}
