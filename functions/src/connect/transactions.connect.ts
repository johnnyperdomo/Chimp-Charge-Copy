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

    const expandedPaymentIntent = await retrieveExpandedPaymentIntent(
      paymentIntent.id,
      connectID
    );

    const {
      chimp_charge_short_id,
      chimp_charge_product_name,
      chimp_charge_payment_link_id,
    } = expandedPaymentIntent.metadata;

    await db.collection('transactions').add({
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent: expandedPaymentIntent,
      productName: chimp_charge_product_name,
      paymentLinkID: chimp_charge_payment_link_id,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      shortID: chimp_charge_short_id,
      isRefunded: false,
    });

    return;
  } catch (err) {
    throw Error(err);
  }
}

export async function updateFirestoreTransaction(
  paymentIntent: Stripe.PaymentIntent,
  connectID: string
) {
  try {
    const findTransaction = await db
      .collection('transactions')
      .where('paymentIntent.id', '==', paymentIntent.id)
      .get();

    if (findTransaction.docs.length === 0) {
      throw Error('Could not find transaction in database');
    }

    const transactionRef = findTransaction.docs[0].ref;

    const expandedPaymentIntent = await retrieveExpandedPaymentIntent(
      paymentIntent.id,
      connectID
    );

    await transactionRef.update({
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent: expandedPaymentIntent,
    });

    return;
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
