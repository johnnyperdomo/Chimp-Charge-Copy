//import * as functions from 'firebase-functions';

import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import * as customers from './customers.connect';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
import { subscriptionFieldType } from '../helpers';

const db = admin.firestore();

// export const getSubscribers = functions.https.onCall(
//   async (data, context) => {}
// );

// export const onCancelSubscriber = functions.https.onCall(
//   async (data, context) => {}
// );

export async function createSubscription(data: any) {
  const priceID: string = data.priceID;
  const paymentMethodID: string = data.paymentMethodID;
  const customerParams: Stripe.CustomerCreateParams = data.customerParams;
  const connectID: string = data.connectID;
  const merchantUID: string = data.merchantUID;
  const chargeIdempotencyKey: string = data.chargeIdempotencyKey;
  const newCustomerIdempotencyKey: string = data.newCustomerIdempotencyKey;
  const paymentLinkMetadata: {} = data.paymentLinkMetadata;

  try {
    const customer = await customers.getOrCreateCustomer(
      customerParams,
      merchantUID,
      connectID,
      newCustomerIdempotencyKey
    );

    await stripe.paymentMethods.attach(
      paymentMethodID,
      {
        customer: customer.id,
      },
      { stripeAccount: connectID }
    );

    await customers.updateCustomerDefaultPaymentMethod(
      customer.id,
      connectID,
      paymentMethodID
    );

    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: priceID }],
        expand: ['latest_invoice.payment_intent'],

        metadata: {
          chimp_charge_firebase_merchant_uid: merchantUID,
          ...paymentLinkMetadata,
        },
      },
      { stripeAccount: connectID, idempotencyKey: chargeIdempotencyKey }
    );

    return subscription;
  } catch (err) {
    console.error('create sub ', err);
    throw new functions.https.HttpsError('unknown', err);
  }
}

export async function createFirestoreSubscription(
  subscription: Stripe.Subscription,
  connectID: string,
  merchantUID: string,
  idempotencyKey: string
) {
  const eventIDQuery = await db
    .collection('subscriptions')
    .where('eventID', '==', idempotencyKey)
    .get();

  if (eventIDQuery.docs.length !== 0) {
    throw Error('This subscription has already been created');
  }

  const { chimp_charge_payment_link_id } = subscription.metadata;

  const subscriptionField: subscriptionFieldType = {
    subscriptionID: subscription.id,
    created: subscription.created,
  };

  await db.collection('subscriptions').add({
    lastUpdated: admin.firestore.Timestamp.now(),
    customerID: subscription.customer as string,
    subscription: subscriptionField,
    paymentLinkID: chimp_charge_payment_link_id || null,
    merchantUID,
    connectID,
    eventID: idempotencyKey,
    status: subscription.status,
  });
}

//TODO: when retriving subscription.items, make sure to expand items...data.product, to get product information
