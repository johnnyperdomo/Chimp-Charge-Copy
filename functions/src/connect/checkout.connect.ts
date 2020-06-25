import { stripe } from '../config';
import Stripe from 'stripe';
import { getOrCreateCustomer } from './customers.connect';
import * as functions from 'firebase-functions';

export async function createPaymentIntent(data: any) {
  //sends generated client secret to client to confirmCardPayment with stripe.js
  const amount: number = data.amount;
  const customerParams: Stripe.CustomerCreateParams = data.customerParams;
  const connectID: string = data.connectID;
  const merchantUID: string = data.merchantUID;

  try {
    const customer = await getOrCreateCustomer(
      customerParams,
      merchantUID,
      connectID
    );

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: 'usd',
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
      },
      { stripeAccount: connectID }
    );

    return paymentIntent;
  } catch (err) {
    throw new functions.https.HttpsError('unknown', err);
  }
}
