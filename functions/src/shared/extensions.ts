import Stripe from 'stripe';

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
};

export interface MembershipFieldType {
  subscriptionID: string;
  subscriptionItemID: string;
  status: Stripe.Subscription.Status;
  interval: string; //month or year
}

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
  //currency is 'usd' by default

  refundedCount: number;
  refundedAmount: number; //stripe fees not included
  successfulCount: number; //this may also include refunded amounts, since they were originally successful
  successfulAmount: number; //stripe fees not included

  //LATER: maybe add disputed amount/total, when handling disputed webhooks, for only lost disputes charge.dispute.closed(lost)
};

/////// Sendgrid Emails //////

export type welcomeEmailType = {
  firstName: string;
  email: string;
};
