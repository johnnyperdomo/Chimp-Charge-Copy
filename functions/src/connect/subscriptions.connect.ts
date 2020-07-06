//import * as functions from 'firebase-functions';

import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import * as customers from './customers.connect';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
import { subscriptionFieldType, planFieldType } from '../helpers';

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
  try {
    const eventIDQuery = await db
      .collection('subscriptions')
      .where('eventID', '==', idempotencyKey)
      .get();

    if (eventIDQuery.docs.length !== 0) {
      throw Error('This subscription has already been created');
    }

    const subscriptionField: subscriptionFieldType = {
      subscriptionID: subscription.id,
      created: subscription.created,
    };

    const stripePlan = subscription.items.data[0].plan;

    const planField: planFieldType = {
      priceID: stripePlan.id,
      productID: stripePlan.product as string,
      created: stripePlan.created,
      amount: stripePlan.amount!,
      currency: stripePlan.currency,
      interval: stripePlan.interval,
      interval_count: stripePlan.interval_count,
    };

    const subscriptionDoc = db.collection('subscriptions').doc();
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);
    const batch = db.batch(); //atomic

    batch.set(subscriptionDoc, {
      lastUpdated: admin.firestore.Timestamp.now(),
      customerID: subscription.customer as string,
      subscription: subscriptionField,
      plan: planField,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      status: subscription.status,
    });

    //increment 'active'
    batch.set(
      aggregationRef,
      { subscriptions: { activeCount: increment } },
      { merge: true }
    ); //aggregate subscription

    await batch.commit();

    return;
  } catch (error) {
    throw Error(error);
  }
}

export async function updateFirestoreSubscription(
  stripeSubscription: Stripe.Subscription,
  connectID: string,
  eventID: string,
  merchantUID?: string
) {
  try {
    const findSubscription = await db
      .collection('subscriptions')
      .where('subscription.subscriptionID', '==', stripeSubscription.id)
      .get();

    //if can't find subscription in firestore, create one(only on update webhook)
    if (findSubscription.docs.length === 0) {
      if (!merchantUID) {
        return;
      }

      //only create subscription if active or trialing === success
      if (
        !(
          stripeSubscription.status === 'active' ||
          stripeSubscription.status === 'trialing'
        )
      ) {
        return;
      }

      await createFirestoreSubscription(
        stripeSubscription,
        connectID,
        merchantUID,
        eventID
      );

      return;
    }

    const subscriptionRef = findSubscription.docs[0].ref;

    await subscriptionRef.update({
      status: stripeSubscription.status,
      lastUpdated: admin.firestore.Timestamp.now(),
    });
    return;
  } catch (error) {
    throw Error(error);
  }
}

export async function cancelFirestoreSubscription(
  stripeSubscription: Stripe.Subscription,
  connectID: string
) {
  try {
    const findSubscription = await db
      .collection('subscriptions')
      .where('subscription.subscriptionID', '==', stripeSubscription.id)
      .get();

    if (stripeSubscription.status !== 'canceled') {
      return;
    }
    const subscriptionRef = findSubscription.docs[0].ref;
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);
    const decrement = admin.firestore.FieldValue.increment(-1);

    const batch = db.batch(); //atomic

    batch.update(subscriptionRef, {
      status: stripeSubscription.status,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    //increment 'cancelled', decrement 'active'
    batch.set(
      aggregationRef,
      { subscriptions: { cancelledCount: increment, activeCount: decrement } },
      { merge: true }
    ); //aggregate subscription

    await batch.commit();

    return;
  } catch (error) {
    throw Error(error);
  }
}
