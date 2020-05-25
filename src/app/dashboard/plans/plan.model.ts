//TODO: pseudo code

export class Plan {
  public id: string;
  public planName: string;
  public type: string;
  public price: string;
  public createdDate: string;

  constructor(
    id: string,
    planName: string,
    type: string, //one-time vs recurring
    price: string,
    createdDate: string //TODO: should be date
  ) {
    this.id = id;
    this.planName = planName;
    this.type = type;
    this.price = price;
    this.createdDate = createdDate;
  }
}
