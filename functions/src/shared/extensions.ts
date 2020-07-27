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

// account emails =========>
export type welcomeEmailType = {
  firstName: string;
  email: string;
};

export type trialStartEmailType = {
  firstName: string;
  lastName: string;
  email: string;
  membershipStatus: Stripe.Subscription.Status;
  membershipPrice: number;
  membershipBillingInterval: Stripe.Price.Recurring.Interval;
  trialStartDate: number; //unix
  trialEndDate: number; //unix
};

export type subscriptionStartEmailType = {
  firstName: string;
  lastName: string;
  email: string;
  membershipStatus: Stripe.Subscription.Status;
  membershipPrice: number;
  membershipBillingInterval: Stripe.Price.Recurring.Interval;
  subscriptionStartDate: number; //unix
};

export type subscriptionCancelEmailType = {
  email: string;
};

// Connect Emails //

// customer connect emails ====>
export type paymentNewConnectCustomerEmailType = {
  merchantBusinessName: string;
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  transactionID: string;
  transactionAmount: number;
  transactionDate: number; //unix
};

export type paymentRefundConnectCustomerEmailType = {
  merchantBusinessName: string;
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  transactionID: string;
  transactionAmount: number;
  transactionDate: number; //unix
};

export type subscriptionPaymentNewConnectCustomerEmailType = {
  merchantBusinessName: string;
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  invoiceID: string;
  invoiceNumber: string; //a string value
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  transactionAmount: number;
  transactionDate: number; //unix
};

export type subscriptionStartConnectCustomerEmailType = {
  merchantBusinessName: string;
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  customerSubscriptionAmount: number;
  customerSubscriptionStartDate: number; //unix
};

export type subscriptionCancelConnectCustomerEmailType = {
  merchantBusinessName: string;
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  customerSubscriptionAmount: number;
  customerSubscriptionCancelledDate: number; //unix
};

export type subscriptionPastDueConnectCustomerEmailType = {
  merchantBusinessName: string;
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  invoiceID: string;
  invoiceNumber: string; //a string value
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  transactionAmount: number;
  transactionDate: number; //unix
};

// merchant connect emails ====>

export type paymentNewConnectMerchantEmailType = {
  firstName: string; //merchant
  email: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  transactionID: string;
  transactionAmount: number;
  transactionDate: number; //unix
};

export type paymentRefundConnectMerchantEmailType = {
  firstName: string; //merchant
  email: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  transactionID: string;
  transactionAmount: number;
  transactionDate: number; //unix
};

export type subscriptionPaymentNewConnectMerchantEmailType = {
  firstName: string; //merchant
  email: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  invoiceID: string;
  invoiceNumber: string; //a string value
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  transactionAmount: number;
  transactionDate: number; //unix
};

export type subscriptionStartConnectMerchantEmailType = {
  firstName: string; //merchant
  email: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  customerSubscriptionAmount: number;
  customerSubscriptionStartDate: number; //unix
};

export type subscriptionCancelConnectMerchantEmailType = {
  firstName: string; //merchant
  email: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  customerSubscriptionAmount: number;
  customerSubscriptionCancelledDate: number; //unix
};

export type subscriptionPastDueConnectMerchantEmailType = {
  firstName: string; //merchant
  email: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  invoiceID: string;
  invoiceNumber: string; //a string value
  customerSubscriptionBillingInterval: Stripe.Price.Recurring.Interval;
  transactionAmount: number;
  transactionDate: number; //unix
};
