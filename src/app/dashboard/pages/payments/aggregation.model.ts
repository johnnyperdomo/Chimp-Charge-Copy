import {
  SubscriptionsInterface,
  TransactionsInterface,
} from 'src/app/shared/interfaces';

import * as MoneyFormatter from 'src/app/shared/accounting';

//aggregation map, quick stats on connect data
//check to see if field values exist
export class Aggregation {
  public merchantUID: string;
  public connectID: string;
  public customerCount: number;
  public subscriptions: SubscriptionsInterface;
  public transactions: TransactionsInterface;
  //FUTURE-UPDATE: paymentLinkCount

  constructor(
    merchantUID: string,
    connectID: string,
    customerCount: number,
    subscriptions: SubscriptionsInterface,
    transactions: TransactionsInterface
  ) {
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.customerCount = customerCount;
    this.subscriptions = subscriptions;
    this.transactions = transactions;
  }

  get successfulAmount() {
    //calculated amount of all transactions => $937.54
    return MoneyFormatter.convertMinorUnitToStandard(
      this.transactions && this.transactions.successfulAmount
    );
  }
}
