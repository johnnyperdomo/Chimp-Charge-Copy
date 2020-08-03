import { TransactionsAggregationInterface } from 'src/app/shared/interfaces';
import * as MoneyFormatter from 'src/app/shared/accounting';

//aggregation currency map, quick stats on connect data for different transactions based on currency type
export class CurrencyStats {
  public merchantUID: string;
  public connectID: string;
  public transactions: TransactionsAggregationInterface;

  constructor(
    merchantUID: string,
    connectID: string,
    transactions: TransactionsAggregationInterface
  ) {
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.transactions = transactions;
  }

  get successfulAmount() {
    //LATER: take into account refunded payments
    //calculated amount of all transactions => $937.54
    return MoneyFormatter.convertMinorUnitToStandard(
      this.transactions && this.transactions.successfulAmount
    );
  }
}
