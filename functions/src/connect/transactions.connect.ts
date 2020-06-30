import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { stripe } from '../config';
const db = admin.firestore();
import * as functions from 'firebase-functions';

// export const getTransactions = functions.https.onCall(
//   async (data, context) => {}
// );

// export const onRefundPayment = functions.https.onCall(
//   async (data, context) => {}
// );

//payment_intent.success || invoice.success
export async function createFirestoreTransaction(
  paymentIntentID: string,
  connectID: string,
  merchantUID: string,
  idempotencyKey: string,
  getMetadataFromInvoice: boolean = false,
  invoiceMetadata?: Stripe.Metadata
) {
  try {
    const eventIDQuery = await db
      .collection('transactions')
      .where('eventID', '==', idempotencyKey)
      .get();

    if (eventIDQuery.docs.length != 0) {
      throw Error('This transaction has already been created');
    }

    const expandedPaymentIntent = await retrieveExpandedPaymentIntent(
      paymentIntentID,
      connectID
    );

    //use invoice metadata if 'getMeta..fromInv..' else, use 'payment_intent'
    //one time payments add metadata in 'payment_intent', but subscription payments add metadata in 'invoice'
    functions.logger.log('invoice meta, : ' + invoiceMetadata!);

    const {
      chimp_charge_short_id,
      chimp_charge_product_name,
      chimp_charge_payment_link_id,
    } = getMetadataFromInvoice
      ? invoiceMetadata!
      : expandedPaymentIntent.metadata;

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

export async function createFirestoreTransactionFromInvoice(
  invoice: Stripe.Invoice,
  connectID: string,
  merchantUID: string,
  idempotencyKey: string
) {
  try {
    if (!invoice.payment_intent) {
      throw Error('No payment intent associated with this transaction');
    }

    const paymentIntentID = invoice.payment_intent as string;
    const invoiceMetadata = invoice.lines.data[0].metadata;

    functions.logger.log('invoice meta from trans, : ' + invoiceMetadata);

    await createFirestoreTransaction(
      paymentIntentID,
      connectID,
      merchantUID,
      idempotencyKey,
      true,
      invoiceMetadata
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}

export async function retrieveExpandedPaymentIntent(
  id: string,
  connectID: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      id,
      { expand: ['customer', 'invoice'] },
      { stripeAccount: connectID }
    );

    return paymentIntent;
  } catch (error) {
    throw Error(error);
  }
}

//TODO:export async function updateFirestoreTransaction() {}

//TODO: add function, when new payment intent webhook is succeeded, add product/price to document of firestore.transaction to map product/price with transaction {update => product: stripe.product, price: stripe.price}
