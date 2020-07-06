import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { stripe } from '../config';
const db = admin.firestore();
import { paymentIntentFieldType, customerFieldType } from '../helpers';

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

    if (eventIDQuery.docs.length !== 0) {
      throw Error('This transaction has already been created');
    }

    if (paymentIntent.invoice) {
      //invoice should be null for one time payments, else exit out
      return;
    }

    const expandedPaymentIntent = await retrieveExpandedPaymentIntent(
      paymentIntent.id,
      connectID
    );

    //extracted from paymentIntent
    const {
      chimp_charge_product_name,
      chimp_charge_product_id,
    } = expandedPaymentIntent.metadata;

    //Fields
    const customerFromExpand = expandedPaymentIntent.customer as Stripe.Customer;

    const paymentIntentField: paymentIntentFieldType = {
      currency: expandedPaymentIntent.currency,
      amount: expandedPaymentIntent.amount,
      paymentIntentID: expandedPaymentIntent.id,
      invoiceID: null,
      created: expandedPaymentIntent.created,
    };

    const customerField: customerFieldType = {
      name: customerFromExpand.name,
      email: customerFromExpand.email,
      customerID: customerFromExpand.id,
      created: customerFromExpand.created,
    };

    await db.collection('transactions').add({
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent: paymentIntentField,
      customer: customerField,
      productName: chimp_charge_product_name || null,
      productID: chimp_charge_product_id || null,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
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

    const eventIDQuery = await db
      .collection('transactions')
      .where('eventID', '==', idempotencyKey)
      .get();

    if (eventIDQuery.docs.length !== 0) {
      throw Error('This transaction has already been created');
    }

    const invoiceMetadata = invoice.lines.data[0].metadata;

    const {
      chimp_charge_product_name,
      chimp_charge_product_id,
    } = invoiceMetadata;

    //Fields

    const retrieveCustomer = await stripe.customers.retrieve(
      invoice.customer as string,
      { stripeAccount: connectID }
    );

    let customerField: customerFieldType | null;

    if (retrieveCustomer.deleted === true) {
      customerField = null;
    } else {
      customerField = {
        name: retrieveCustomer.name,
        email: retrieveCustomer.email,
        customerID: retrieveCustomer.id,
        created: retrieveCustomer.created,
      };
    }

    const paymentIntentField: paymentIntentFieldType = {
      currency: invoice.currency,
      amount: invoice.amount_paid,
      paymentIntentID: invoice.payment_intent as string,
      invoiceID: invoice.id,
      created: invoice.created,
    };

    await db.collection('transactions').add({
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent: paymentIntentField,
      customer: customerField,
      productName: chimp_charge_product_name || null,
      productID: chimp_charge_product_id || null,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      isRefunded: false,
    });

    //update invoice metadata to payment intent metadata for easier referencing later
    await updateStripePaymentIntentMetadata(
      paymentIntentField.paymentIntentID,
      connectID,
      invoiceMetadata
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}

export async function refundFirestoreTransaction(charge: Stripe.Charge) {
  try {
    const findTransaction = await db
      .collection('transactions')
      .where(
        'paymentIntent.paymentIntentID',
        '==',
        charge.payment_intent as string
      )
      .get();

    if (findTransaction.docs.length === 0) {
      return;
    }

    const transactionRef = findTransaction.docs[0].ref;

    await transactionRef.update({
      isRefunded: true,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

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

async function updateStripePaymentIntentMetadata(
  id: string,
  connectID: string,
  metadata: Stripe.Metadata
) {
  try {
    await stripe.paymentIntents.update(
      id,
      { metadata },
      { stripeAccount: connectID }
    );
    return;
  } catch (error) {
    throw error();
  }
}
//TODO: add function, when new payment intent webhook is succeeded, add product/price to document of firestore.transaction to map product/price with transaction {update => product: stripe.product, price: stripe.price}
