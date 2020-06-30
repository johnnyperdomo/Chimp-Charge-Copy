import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { stripe } from '../config';
const db = admin.firestore();

// export const getTransactions = functions.https.onCall(
//   async (data, context) => {}
// );

// export const onRefundPayment = functions.https.onCall(
//   async (data, context) => {}
// );

//payment_intent.success || invoice.success
export async function createFirestoreTransaction(
  paymentIntent: Stripe.PaymentIntent,
  connectID: string,
  merchantUID: string,
  idempotencyKey: string
) {
  try {
    const eventIDQuery = await db
      .collection('transactions')
      .where('eventID', '==', idempotencyKey)
      .get();

    if (eventIDQuery.docs.length != 0) {
      //if eventID already exists, function has already been processed
      throw Error('This transaction has already been created');
    }

    const {
      chimp_charge_short_id,
      chimp_charge_product_name,
      chimp_charge_payment_link_id,
    } = paymentIntent.metadata;

    await db.collection('transactions').add({
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent,
      productName: chimp_charge_product_name,
      paymentLinkID: chimp_charge_payment_link_id,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      shortID: chimp_charge_short_id,
      isRefunded: false,
    });
  } catch (err) {
    throw Error(err);
  }
}

export async function retrieveExpandedPaymentIntent(
  id: string,
  connectID: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      id,
      { expand: ['customer'] },
      { stripeAccount: connectID }
    );

    return paymentIntent;
  } catch (error) {
    throw Error(error);
  }
}
//TODO:export async function updateFirestoreTransaction() {}

//TODO: add function, when new payment intent webhook is succeeded, add product/price to document of firestore.transaction to map product/price with transaction {update => product: stripe.product, price: stripe.price}
