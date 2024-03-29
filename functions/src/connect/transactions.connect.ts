import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { stripe } from '../shared/stripe-config';
import {
  paymentIntentFieldType,
  customerFieldType,
} from '../shared/extensions';
import * as functions from 'firebase-functions';
import {
  sgPaymentNewConnectCustomerEmail,
  sgPaymentNewConnectMerchantEmail,
  sgSubscriptionPaymentNewConnectCustomerEmail,
  sgSubscriptionPaymentNewConnectMerchantEmail,
  sgPaymentRefundConnectCustomerEmail,
  sgPaymentRefundConnectMerchantEmail,
} from './emails.connect';

const db = admin.firestore();
const auth = admin.auth();

//Client side ========================>

export async function onRefundTransaction(data: any, userID: string) {
  const paymentIntentID: string = data.paymentIntentID;

  try {
    const userRef = db.doc(`merchants/${userID}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data()!;

    const stripeConnectID = userData.connectID;

    if (!stripeConnectID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Stripe Connect ID not found'
      );
    }

    const stripeRefundResponse = await refundStripeTransaction(
      paymentIntentID,
      stripeConnectID
    );

    await refundFirestoreTransaction(
      stripeRefundResponse.charge as Stripe.Charge,
      stripeConnectID,
      userID
    );

    return;
  } catch (err) {
    console.error(err);
    throw new functions.https.HttpsError('unknown', err);
  }
}

//////////////////////////////////////

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
      isDisputed: false, //lost dispute only//LATER
    };

    const transactionRef = db.collection('transactions').doc();

    await batchCreateTransaction(
      transactionRef,
      transactionDocBody,
      expandedPaymentIntent.amount,
      expandedPaymentIntent.currency,
      customerFromExpand.id,
      chimp_charge_product_id,
      connectID,
      merchantUID
    );

    await sendNewPaymentEmail(
      merchantUID,
      customerFromExpand,
      chimp_charge_product_name,
      paymentIntent
    );

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
      isDisputed: false, //lost dispute only //LATER
    };

    const transactionRef = db.collection('transactions').doc();

    await batchCreateTransaction(
      transactionRef,
      transactionDocBody,
      invoice.amount_paid,
      invoice.currency,
      invoice.customer as string,
      chimp_charge_product_id,
      connectID,
      merchantUID
    );

    await sendNewSubscriptionPaymentEmail(
      merchantUID,
      retrieveCustomer as Stripe.Customer,
      chimp_charge_product_name,
      invoice
    );

    return;
  } catch (error) {
    functions.logger.error('invoice transaction error: ' + error);
    throw Error(error);
  }
}

export async function refundFirestoreTransaction(
  charge: Stripe.Charge,
  connectID: string,
  merchantUID: string
) {
  try {
    //LATER: check to see if object is already refunded, so we don't trigger twice and mess with aggregation
    const findTransaction = await db
      .collection('transactions')
      .where(
        'paymentIntent.paymentIntentID',
        '==',
        charge.payment_intent as string
      )
      .get();

    if (findTransaction.docs.length === 0) {
      //LATER: make sure all collection queries across the app have this error check
      return;
    }

    if (
      findTransaction.docs[0].data().isRefunded &&
      findTransaction.docs[0].data().isRefunded === true
    ) {
      //should not try to refund again if already refunded
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
        charge.currency,
        charge.customer as string,
        stripeProductID,
        connectID,
        merchantUID
      );

      const chargeCustomer = await stripe.customers.retrieve(
        charge.customer as string,
        { stripeAccount: connectID }
      );

      const invoiceMetadata = retrieveInvoice.lines.data[0].metadata;

      const productName = invoiceMetadata.chimp_charge_product_name;

      await sendPaymentRefundEmail(
        merchantUID,
        chargeCustomer as Stripe.Customer,
        productName,
        charge
      );

      return;
    }

    const {
      chimp_charge_product_id,
      chimp_charge_product_name,
    } = charge.metadata;

    await batchRefundTransaction(
      transactionRef,
      charge.amount,
      charge.currency,
      charge.customer as string,
      chimp_charge_product_id,
      connectID,
      merchantUID
    );

    const retrieveCustomer = await stripe.customers.retrieve(
      charge.customer as string,
      { stripeAccount: connectID }
    );

    await sendPaymentRefundEmail(
      merchantUID,
      retrieveCustomer as Stripe.Customer,
      chimp_charge_product_name,
      charge
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
  transactionCurrency: string,
  stripeCustomerID: string,
  productID: string,
  connectID: string,
  merchantUID: string
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

    // sub-collection, grouped by currency
    const aggregationCurrenciesRef = db
      .collection('aggregations')
      .doc(connectID)
      .collection('currencies')
      .doc(transactionCurrency);

    const increment = admin.firestore.FieldValue.increment(1);
    const transactionAmountIncrement = admin.firestore.FieldValue.increment(
      transactionAmount
    );

    const batch = db.batch(); //atomic

    //create transaction doc
    batch.set(transactionRef, transactionDocBody);

    //aggregation map
    batch.set(
      aggregationCurrenciesRef,
      {
        transactions: {
          successfulCount: increment,
          successfulAmount: transactionAmountIncrement,
        },
        connectID,
        merchantUID,
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
    functions.logger.log('batch invoice transaction success');

    return;
  } catch (error) {
    functions.logger.error('batch invoice transaction error: ' + error);

    throw Error(error);
  }
}

async function batchRefundTransaction(
  transactionRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData
  >,
  refundAmount: number,
  refundCurrency: string,
  stripeCustomerID: string,
  productID: string,
  connectID: string,
  merchantUID: string
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

    // sub-collection, grouped by currency
    const aggregationCurrenciesRef = db
      .collection('aggregations')
      .doc(connectID)
      .collection('currencies')
      .doc(refundCurrency);

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
      aggregationCurrenciesRef,
      {
        transactions: {
          refundedCount: increment,
          refundedAmount: refundAmountIncrement,
        },
        connectID,
        merchantUID,
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

//Stripe Methods =====================>

async function refundStripeTransaction(
  paymentIntentID: string,
  connectID: string
) {
  try {
    const response = await stripe.refunds.create(
      { payment_intent: paymentIntentID, expand: ['charge'] },
      {
        stripeAccount: connectID,
      }
    );
    return response;
  } catch (error) {
    throw Error(error);
  }
}

// Sendgrid emails

async function sendNewPaymentEmail(
  merchantUID: string,
  customer: Stripe.Customer,
  productName: string,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const merchantRef = db.doc(`merchants/${merchantUID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data();

    if (!merchantData) {
      return;
    }

    const merchantBusinessName = merchantData.businessName;
    const merchantEmail = (await auth.getUser(merchantUID)).email!;
    const merchantFirstName = merchantData.firstName;

    await sgPaymentNewConnectMerchantEmail(
      merchantFirstName,
      merchantEmail,
      customer,
      productName,
      paymentIntent
    );

    await sgPaymentNewConnectCustomerEmail(
      merchantBusinessName,
      merchantEmail,
      customer,
      productName,
      paymentIntent
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}

async function sendNewSubscriptionPaymentEmail(
  merchantUID: string,
  customer: Stripe.Customer,
  productName: string,
  invoice: Stripe.Invoice
) {
  try {
    const merchantRef = db.doc(`merchants/${merchantUID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data();

    if (!merchantData) {
      return;
    }

    const merchantBusinessName = merchantData.businessName;
    const merchantEmail = (await auth.getUser(merchantUID)).email!;
    const merchantFirstName = merchantData.firstName;

    await sgSubscriptionPaymentNewConnectMerchantEmail(
      merchantFirstName,
      merchantEmail,
      customer,
      productName,
      invoice
    );

    await sgSubscriptionPaymentNewConnectCustomerEmail(
      merchantBusinessName,
      merchantEmail,
      customer,
      productName,
      invoice
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}

async function sendPaymentRefundEmail(
  merchantUID: string,
  customer: Stripe.Customer,
  productName: string,
  charge: Stripe.Charge
) {
  try {
    const merchantRef = db.doc(`merchants/${merchantUID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data();

    if (!merchantData) {
      return;
    }

    const merchantBusinessName = merchantData.businessName;
    const merchantEmail = (await auth.getUser(merchantUID)).email!;
    const merchantFirstName = merchantData.firstName;

    await sgPaymentRefundConnectMerchantEmail(
      merchantFirstName,
      merchantEmail,
      customer,
      productName,
      charge
    );

    await sgPaymentRefundConnectCustomerEmail(
      merchantBusinessName,
      merchantEmail,
      customer,
      productName,
      charge
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}
