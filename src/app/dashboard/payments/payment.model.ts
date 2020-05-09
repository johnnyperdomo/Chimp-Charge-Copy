//TODO: pseudo code
export class Payment {
  public paymentID: string;
  public customerName: string;
  public amount: string;
  public status: string;
  public date: string;
  public type: string;

  constructor(
    paymentID: string,
    customerName: string,
    amount: string,
    status: string,
    date: string,
    type: string
  ) {
    this.paymentID = paymentID;
    this.customerName = customerName;
    this.amount = amount;
    this.status = status;
    this.date = date;
    this.type = type;
  }
}
