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

export type planFieldType = {
  priceID: string;
  productID: string;
  created: number; //unix
  amount: number;
  currency: string;
  interval: string; //month,
  interval_count: number; //gets charged every '1' month
};

//Webhooks ==============>
export type stripeEventType =
  | 'payment_intent'
  | 'invoice'
  | 'customer'
  | 'product'
  | 'price'
  | 'charge'
  | 'subscription';

//Aggregations =============>
export type transactionsType = {
  currency: string; //usd
  refundedCount: number;
  refundedGrossAmount: number;
  successfulCount: number; //this may also include refunded amounts, since they were originally successful
  successfulAmountGross: number; //without stripe fees, original
  successfulAmountNet: number; //with stripe fees
};
