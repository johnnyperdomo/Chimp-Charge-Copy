//TODO: pseudo code
export class Payment {
  public paymentID: string;
  public customerName: string;
  public customerEmail: string;
  public amount: string;
  public status: string;
  public date: string;
  public type: string;

  constructor(
    paymentID: string,
    customerName: string,
    customerEmail: string,
    amount: string,
    status: string,
    date: string,
    type: string
  ) {
    this.paymentID = paymentID;
    this.customerName = customerName;
    this.customerEmail = customerEmail;
    this.amount = amount;
    this.status = status;
    this.date = date;
    this.type = type;
  }
}
