//TODO: pseudo code
export class Payment {
  public paymentID: string;
  public customerName: string;
  public customerEmail: string;
  public amount: string;
  public linkName: string;
  public status: string;
  public date: string; //TODO: should be date
  public type: string;

  constructor(
    paymentID: string,
    customerName: string,
    customerEmail: string,
    amount: string,
    linkName: string,
    status: string,
    date: string,
    type: string
  ) {
    this.paymentID = paymentID;
    this.customerName = customerName;
    this.customerEmail = customerEmail;
    this.amount = amount;
    this.linkName = linkName;
    this.status = status;
    this.date = date;
    this.type = type;
  }
}