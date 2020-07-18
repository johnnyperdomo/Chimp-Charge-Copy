import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MembershipFieldType } from '../shared/extensions';
import { stripe, monthlyProPriceID } from '../shared/config';
import { updateCustomerDefaultPaymentMethodMerchant } from './customers.merchant';

const db = admin.firestore();

//Stripe

// if user reactivates from the cancelled state
export async function reactivateSubscription(data: any, userID: string) {
  const paymentMethodID: string = data.paymentMethodID;
  const chargeIdempotencyKey: string = data.chargeIdempotencyKey;

  try {
    const userRef = db.doc(`merchants/${userID}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data()!;

    const stripeCustomerID = userData.customerID;

    if (!stripeCustomerID) {
      throw Error("can't find your stripe customerID");
    }

    const customer = (await stripe.customers.retrieve(
      stripeCustomerID
    )) as Stripe.Customer;

    await stripe.paymentMethods.attach(paymentMethodID, {
      customer: customer.id,
    });

    await updateCustomerDefaultPaymentMethodMerchant(
      customer.id,
      paymentMethodID
    );

    //create subscription in stripe
    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: monthlyProPriceID }],
        expand: ['latest_invoice.payment_intent'],
      },
      { idempotencyKey: chargeIdempotencyKey }
    );

    // only add successful subscription
    if (
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    ) {
      await addSubscriptionOnFirestoreMembership(subscription);
    }

    // override previous membership details with new subscription details in firestore doc
    return subscription;
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error);
  }
}

// on create subscription for merchant
export async function addSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchantByCustomerID = await db
      .collection('merchants')
      .where('customerID', '==', subscription.customer as String)
      .get();

    // if can't find merchant by customerID
    if (findMerchantByCustomerID.docs.length === 0) {
      return;
    }

    const currentMembership: MembershipFieldType | null = findMerchantByCustomerID.docs[0].data()
      .membership;

    // get the sub id of doc if it exists
    const currentSubID = currentMembership && currentMembership.subscriptionID;

    // check if subID has already been written to doc
    if (currentSubID === subscription.id) {
      functions.logger.log('sub id already written, exit out');
      return;
    }

    const merchantRef = findMerchantByCustomerID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}

// on update subscription for merchant
export async function updateSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchantBySubscriptionID = await db
      .collection('merchants')
      .where('membership.subscriptionID', '==', subscription.id)
      .get();

    // if can't find merchant by subID

    if (findMerchantBySubscriptionID.docs.length === 0) {
      return;
    }

    const merchantRef = findMerchantBySubscriptionID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}

// on cancel subscription for merchant
export async function cancelSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchantBySubscriptionID = await db
      .collection('merchants')
      .where('membership.subscriptionID', '==', subscription.id)
      .get();

    // if can't find merchant by subID
    if (findMerchantBySubscriptionID.docs.length === 0) {
      return;
    }

    const currentMembership: MembershipFieldType | null = findMerchantBySubscriptionID.docs[0].data()
      .membership;

    // get the sub id of doc if it exists
    const currentStatus = currentMembership && currentMembership.status;

    // check if status has already been cancelled in doc; prevent duplicate write events
    if (currentStatus === 'canceled') {
      return;
    }

    const merchantRef = findMerchantBySubscriptionID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}
