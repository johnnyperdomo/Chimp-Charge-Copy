import { SubscriptionsAggregationFieldInterface } from 'src/app/shared/interfaces';

//aggregation map, quick stats on connect data
export class AggStats {
  public merchantUID: string;
  public connectID: string;
  public customerCount: number;
  public subscriptions: SubscriptionsAggregationFieldInterface;
  //LATER: paymentLinkCount

  constructor(
    merchantUID: string,
    connectID: string,
    customerCount: number,
    subscriptions: SubscriptionsAggregationFieldInterface
  ) {
    this.merchantUID = merchantUID;
    this.connectID = connectID;
    this.customerCount = customerCount;
    this.subscriptions = subscriptions;
  }
}
