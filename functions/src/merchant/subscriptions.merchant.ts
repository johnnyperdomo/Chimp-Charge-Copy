import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MembershipFieldType } from '../shared/extensions';

const db = admin.firestore();

// on create subscription for merchant
export async function addSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchant = await db
      .collection('merchants')
      .where('customerID', '==', subscription.customer as String)
      .get();

    // if can't find merchant by customerID
    if (findMerchant.docs.length === 0) {
      functions.logger.log('couldnt find merchant by cust ID');
      return;
    }

    const currentMembership: MembershipFieldType | null = findMerchant.docs[0].data()
      .membership;

    // get the sub id of doc if it exists
    const currentSubID = currentMembership && currentMembership.subscriptionID;

    // check if subID has already been written to doc
    if (currentSubID === subscription.id) {
      functions.logger.log('subcription already added, exit out ');
      return;
    }

    const merchantRef = findMerchant.docs[0].ref;

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
