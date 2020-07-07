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

    const transactionDocBody = {
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent: paymentIntentField,
      customer: customerField,
      productName: chimp_charge_product_name || null,
      productID: chimp_charge_product_id || null,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      isRefunded: false,
      isDisputed: false, //lost dispute only//FUTURE-UPDATE
    };

    const transactionRef = db.collection('transactions').doc();

    await batchCreateTransaction(
      transactionRef,
      transactionDocBody,
      expandedPaymentIntent.amount,
      customerFromExpand.id,
      chimp_charge_product_id,
      connectID
    );
    // await db.collection('transactions').add({
    //   lastUpdated: admin.firestore.Timestamp.now(),
    //   paymentIntent: paymentIntentField,
    //   customer: customerField,
    //   productName: chimp_charge_product_name || null,
    //   productID: chimp_charge_product_id || null,
    //   merchantUID,
    //   connectID,
    //   eventID: idempotencyKey,
    //   isRefunded: false,
    //   isDisputed: false, //lost dispute only//FUTURE-UPDATE
    // });

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

    //update invoice metadata to payment intent metadata for easier referencing later
    await updateStripePaymentIntentMetadata(
      paymentIntentField.paymentIntentID,
      connectID,
      invoiceMetadata
    );

    const transactionDocBody = {
      lastUpdated: admin.firestore.Timestamp.now(),
      paymentIntent: paymentIntentField,
      customer: customerField,
      productName: chimp_charge_product_name || null,
      productID: chimp_charge_product_id || null,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      isRefunded: false,
      isDisputed: false, //lost dispute only //FUTURE-UPDATE
    };

    const transactionRef = db.collection('transactions').doc();

    await batchCreateTransaction(
      transactionRef,
      transactionDocBody,
      invoice.amount_paid,
      invoice.customer as string,
      chimp_charge_product_id,
      connectID
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}

export async function refundFirestoreTransaction(
  charge: Stripe.Charge,
  connectID: string
) {
  try {
    //FUTURE-UPDATE: check to see if object is already refunded, so we don't trigger twice and mess with aggregation
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
    //if refund has an invoice(from sub), get metadata from stripe invoice
    if (charge.invoice) {
      const retrieveInvoice = await stripe.invoices.retrieve(
        charge.invoice as string,
        { stripeAccount: connectID }
      );

      const stripeProductID = retrieveInvoice.lines.data[0].plan
        ?.product as string;

      await batchRefundTransaction(
        transactionRef,
        charge.amount,
        charge.customer as string,
        stripeProductID,
        connectID
      );

      return;
    }

    const { chimp_charge_product_id } = charge.metadata;

    await batchRefundTransaction(
      transactionRef,
      charge.amount,
      charge.customer as string,
      chimp_charge_product_id,
      connectID
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

//aggregation =================>
async function batchCreateTransaction(
  transactionRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData
  >,
  transactionDocBody: any,
  transactionAmount: number,
  stripeCustomerID: string,
  productID: string,
  connectID: string
) {
  try {
    const findCustomer = await db
      .collection('customers')
      .where('customer.customerID', '==', stripeCustomerID)
      .get();

    const findPaymentLinkFromProduct = await db
      .collection('payment-links')
      .where('product.id', '==', productID)
      .get();

    const paymentLinkRef = findPaymentLinkFromProduct.docs[0].ref;
    const customerRef = findCustomer.docs[0].ref;
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);
    const transactionAmountIncrement = admin.firestore.FieldValue.increment(
      transactionAmount
    );

    const batch = db.batch(); //atomic

    //create transaction doc
    batch.set(transactionRef, transactionDocBody);

    //aggregation map
    batch.set(
      aggregationRef,
      {
        transactions: {
          successfulCount: increment,
          successfulAmount: transactionAmountIncrement,
        },
      },
      { merge: true }
    );

    //customer aggregation
    batch.set(
      customerRef,
      {
        transactions: {
          successfulCount: increment,
          successfulAmount: transactionAmountIncrement,
        },
      },
      { merge: true }
    );

    //paymentLink aggregation
    batch.set(
      paymentLinkRef,
      {
        transactions: {
          successfulCount: increment,
          successfulAmount: transactionAmountIncrement,
        },
      },
      { merge: true }
    );

    await batch.commit();
    return;
  } catch (error) {
    throw Error(error);
  }
}

async function batchRefundTransaction(
  transactionRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData
  >,
  refundAmount: number,
  stripeCustomerID: string,
  productID: string,
  connectID: string
) {
  try {
    const findCustomer = await db
      .collection('customers')
      .where('customer.customerID', '==', stripeCustomerID)
      .get();

    const findPaymentLinkFromProduct = await db
      .collection('payment-links')
      .where('product.id', '==', productID)
      .get();

    const paymentLinkRef = findPaymentLinkFromProduct.docs[0].ref;
    const customerRef = findCustomer.docs[0].ref;
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);
    const refundAmountIncrement = admin.firestore.FieldValue.increment(
      refundAmount
    );

    const batch = db.batch(); //atomic

    //create transaction doc for refund
    batch.update(transactionRef, {
      isRefunded: true,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    //aggregation map
    batch.set(
      aggregationRef,
      {
        transactions: {
          refundedCount: increment,
          refundedAmount: refundAmountIncrement,
        },
      },
      { merge: true }
    );

    //customer aggregation
    batch.set(
      customerRef,
      {
        transactions: {
          refundedCount: increment,
          refundedAmount: refundAmountIncrement,
        },
      },
      { merge: true }
    );

    //paymentLink aggregation
    batch.set(
      paymentLinkRef,
      {
        transactions: {
          refundedCount: increment,
          refundedAmount: refundAmountIncrement,
        },
      },
      { merge: true }
    );

    await batch.commit();

    return;
  } catch (error) {
    throw Error(error);
  }
}
