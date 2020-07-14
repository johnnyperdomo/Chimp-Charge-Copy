//import * as functions from 'firebase-functions';

import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import * as customers from './customers.connect';
import { stripe } from '../shared/config';
import * as admin from 'firebase-admin';
import { subscriptionFieldType, planFieldType } from '../shared/extensions';

const db = admin.firestore();

//Client Side =====================>
export async function onCancelSubscription(data: any, userID: string) {
  const subscriptionID: string = data.subscriptionID;

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

    const stripeCancelSubResponse = await cancelStripeSubscription(
      subscriptionID,
      stripeConnectID
    );

    await cancelFirestoreSubscription(
      stripeCancelSubResponse,
      stripeConnectID,
      userID
    );

    return;
  } catch (err) {
    console.error(err);
    throw new functions.https.HttpsError('unknown', err);
  }
}

/////
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
    };

    const subscriptionDocBody = {
      lastUpdated: admin.firestore.Timestamp.now(),
      customerID: subscription.customer as string,
      subscription: subscriptionField,
      plan: planField,
      merchantUID,
      connectID,
      eventID: idempotencyKey,
      status: subscription.status,
    };

    const subscriptionDoc = db.collection('subscriptions').doc();

    await batchCreateFirestoreSubscription(
      subscriptionDoc,
      subscription,
      subscriptionDocBody,
      connectID,
      merchantUID
    );

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
  connectID: string,
  merchantUID: string
) {
  try {
    const findSubscription = await db
      .collection('subscriptions')
      .where('subscription.subscriptionID', '==', stripeSubscription.id)
      .get();

    //LATER: make sure collection queries are not returned empty

    if (
      findSubscription.docs[0].exists &&
      findSubscription.docs[0].data().status &&
      findSubscription.docs[0].data().status === 'canceled'
    ) {
      //should not try to cancel again if already canceled
      return;
    }

    if (stripeSubscription.status !== 'canceled') {
      return;
    }

    const subscriptionRef = findSubscription.docs[0].ref;

    await batchCancelFirestoreSubscription(
      subscriptionRef,
      stripeSubscription,
      connectID,
      merchantUID
    );

    return;
  } catch (error) {
    throw Error(error);
  }
}

//aggregation =================>
async function batchCreateFirestoreSubscription(
  subscriptionRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData
  >,
  stripeSubscription: Stripe.Subscription,
  subscriptionDocBody: any,
  connectID: string,
  merchantUID: string
) {
  try {
    const stripePlan = stripeSubscription.items.data[0].plan;

    const findCustomer = await db
      .collection('customers')
      .where('customer.customerID', '==', stripeSubscription.customer as string)
      .get();

    const findPaymentLinkFromProduct = await db
      .collection('payment-links')
      .where('product.id', '==', stripePlan.product as string)
      .get();

    const paymentLinkRef = findPaymentLinkFromProduct.docs[0].ref;
    const customerRef = findCustomer.docs[0].ref;
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);

    const batch = db.batch(); //atomic

    //create sub doc
    batch.set(subscriptionRef, subscriptionDocBody);

    //increment 'active'
    //aggregation map
    batch.set(
      aggregationRef,
      { subscriptions: { activeCount: increment }, connectID, merchantUID },
      { merge: true }
    );

    //customer aggregation
    batch.set(
      customerRef,
      { activeSubscriptionsCount: increment },
      { merge: true }
    );

    //paymentLink aggregation
    batch.set(
      paymentLinkRef,
      { activeSubscriptionsCount: increment },
      { merge: true }
    );

    await batch.commit();
    functions.logger.log('batch create sub success');

    return;
  } catch (error) {
    functions.logger.error('batch create sub error: ' + error);
    throw Error(error);
  }
}

async function batchCancelFirestoreSubscription(
  subscriptionRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData
  >,
  stripeSubscription: Stripe.Subscription,
  connectID: string,
  merchantUID: string
) {
  try {
    const stripePlan = stripeSubscription.items.data[0].plan;

    const findCustomer = await db
      .collection('customers')
      .where('customer.customerID', '==', stripeSubscription.customer as string)
      .get();

    const findPaymentLinkFromProduct = await db
      .collection('payment-links')
      .where('product.id', '==', stripePlan.product as string)
      .get();

    const paymentLinkRef = findPaymentLinkFromProduct.docs[0].ref;
    const customerRef = findCustomer.docs[0].ref;
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);
    const decrement = admin.firestore.FieldValue.increment(-1);

    const batch = db.batch(); //atomic

    //cancel sub
    batch.update(subscriptionRef, {
      status: stripeSubscription.status,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    //increment 'cancelled', decrement 'active'
    //aggregation map
    batch.set(
      aggregationRef,
      {
        subscriptions: { cancelledCount: increment, activeCount: decrement },
        connectID,
        merchantUID,
      },
      { merge: true }
    );

    //customer aggregation
    batch.set(
      customerRef,
      { activeSubscriptionsCount: decrement },
      { merge: true }
    );

    //paymentLink aggregation
    batch.set(
      paymentLinkRef,
      { activeSubscriptionsCount: decrement },
      { merge: true }
    );

    await batch.commit();
    return;
  } catch (error) {
    throw Error(error);
  }
}

//Stripe methods =============>

async function cancelStripeSubscription(
  subscriptionID: string,
  connectID: string
) {
  try {
    const response = await stripe.subscriptions.del(subscriptionID, {
      stripeAccount: connectID,
    });
    return response;
  } catch (error) {
    throw error;
  }
}
