import Stripe from 'stripe';

export interface CustomerFieldInterface {
  created: number; //unix
  customerID: string;
  email: string;
  name: string;
}

export interface PaymentIntentFieldInterface {
  amount: number;
  created: number; //unix,
  currency: string;
  invoiceID: string | null;
  paymentIntentID: string;
}

export interface SubscriptionsAggregationFieldInterface {
  activeCount: number;
  cancelledCount: number;
}

export interface TransactionsAggregationInterface {
  //LATER: refundedAmount: number;
  //LATER: refundedCount: number;
  successfulAmount: number;
  successfulCount: number;
}

export interface SubscriptionFieldInterface {
  created: number; //unix,
  subscriptionID: string;
}

export interface PaymentLinkFieldInterface {
  created: number; //unix
  paymentLinkID: string;
  name: string;
  description: string | null;
  amount: number;
  billingInterval: string | null;
}

export interface MembershipFieldInterface {
  subscriptionID: string;
  subscriptionItemID: string;
  status: Stripe.Subscription.Status;
  interval: string; //month or year
  latestInvoiceID: string;
}
