import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { MembershipFieldType } from '../shared/extensions';

const db = admin.firestore();

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
      return;
    }

    const merchantRef = findMerchantByCustomerID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
      latestInvoiceID: subscription.latest_invoice as string,
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
      latestInvoiceID: subscription.latest_invoice as string,
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
      latestInvoiceID: subscription.latest_invoice as string,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}
