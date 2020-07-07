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

export interface SubscriptionsInterface {
  activeCount: number;
  cancelledCount: number;
}

export interface TransactionsInterface {
  //FUTURE-UPDATE: refundedAmount: number;
  //FUTURE-UPDATE: refundedCount: number;
  successfulAmount: number;
  successfulCount: number;
}
