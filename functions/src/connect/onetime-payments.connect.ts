import { stripe } from '../shared/stripe-config';
import Stripe from 'stripe';
import { getOrCreateCustomer } from './customers.connect';
import * as functions from 'firebase-functions';

export async function createPaymentIntent(data: any) {
  //sends generated client secret to client to confirmCardPayment with stripe.js
  const amount: number = data.amount;
  const customerParams: Stripe.CustomerCreateParams = data.customerParams;
  const connectID: string = data.connectID;
  const merchantUID: string = data.merchantUID;
  const chargeIdempotencyKey: string = data.chargeIdempotencyKey;
  const newCustomerIdempotencyKey: string = data.newCustomerIdempotencyKey;
  const paymentLinkMetadata: {} = data.paymentLinkMetadata;

  try {
    const customer = await getOrCreateCustomer(
      customerParams,
      merchantUID,
      connectID,
      newCustomerIdempotencyKey
    );

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: 'usd',
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          chimp_charge_firebase_merchant_uid: merchantUID,
          ...paymentLinkMetadata,
        },
      },
      { stripeAccount: connectID, idempotencyKey: chargeIdempotencyKey }
    );

    return paymentIntent;
  } catch (err) {
    throw new functions.https.HttpsError('unknown', err);
  }
}
