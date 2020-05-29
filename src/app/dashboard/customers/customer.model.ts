// TODO: Pseudo code - update model
export class Customer {
  public id: string;
  public customerName: string;
  public customerEmail: string;
  public totalTransactions: Number;
  public totalPayments: string;
  public linkName: string;
  public createdDate: string;
  public recentTransaction: string;
  public isSubscriber: Boolean;

  constructor(
    id: string,
    customerName: string,
    customerEmail: string,
    totalTransactions: Number,
    totalPayments: string,
    linkName: string, //TODO: make this a one-to-many relationship, one customer can be on many subscriptions //should be array of linkids
    createdDate: string, //TODO: should be date
    recentTransaction: string, //TODO: should be date
    isSubscriber: Boolean
  ) {
    this.id = id;
    this.customerName = customerName;
    this.customerEmail = customerEmail;
    this.totalTransactions = totalTransactions;
    this.totalPayments = totalPayments;
    this.linkName = linkName;
    this.createdDate = createdDate;
    this.recentTransaction = recentTransaction;
    this.isSubscriber = isSubscriber;
  }
}
