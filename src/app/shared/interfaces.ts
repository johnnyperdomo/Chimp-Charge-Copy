export interface customerFieldInterface {
  created: number; //unix
  customerID: string;
  email: string;
  name: string;
}

export interface paymentIntentFieldInterface {
  amount: number;
  created: number; //unix,
  currency: string;
  invoiceID: string | null;
  paymentIntentID: string;
}
