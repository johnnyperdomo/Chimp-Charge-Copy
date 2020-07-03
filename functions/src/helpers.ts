//Customers =========>
export type customerFieldType = {
  name: string | null;
  email: string | null;
  customerID: string;
  created: number; //unix
};

//Transactions ========>
export type paymentIntentFieldType = {
  currency: string;
  amount: number;
  paymentIntentID: string;
  invoiceID: string | null; //if subscription
  created: number; //unix
};

//Subscriptions
export type subscriptionFieldType = {
  subscriptionID: string;
  created: number; //unix
};

//Webhooks
export type stripeEventType =
  | 'payment_intent'
  | 'invoice'
  | 'customer'
  | 'product'
  | 'price'
  | 'charge'
  | 'subscription';
