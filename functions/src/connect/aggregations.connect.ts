import Stripe from 'stripe';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();
//these functions are used to map grouped data for faster/cheaper querying when fetching items from database

//TODO: Batch firestore writes
export async function aggregatePaymentIntent(connectID: string) {
  await createAggregationMapIfNecessary(connectID);
  //TODO: set timeout to 180 seconds
  //aggregations.successfulTransactions(up/down)
  //customers.successfulTransactions(up/down)
  //payment-links.successfulTransactions(up/down)
}

export async function aggregateCustomer(connectID: string) {
  try {
    await createAggregationMapIfNecessary(connectID);

    const customers: Stripe.Customer[] = await stripe.customers
      .list({ stripeAccount: connectID })
      .autoPagingToArray({ limit: 10000 });

    const filteredCustomers = customers.filter((data) =>
      getOnlyChimpChargeData(data)
    );

    await db
      .collection('aggregations')
      .doc(connectID)
      .set({ customerCount: filteredCustomers.length }, { merge: true });

    return;
  } catch (error) {
    throw Error(error);
  }

  //TODO: set timeout to 180 seconds
  //aggregations.customers(up)
}

export async function aggregatePaymentLink(connectID: string) {
  await createAggregationMapIfNecessary(connectID);
  //aggregations.paymentLinks(up/down)
}

export async function aggregateSubscription(connectID: string) {
  await createAggregationMapIfNecessary(connectID);

  //TODO: set timeout to 180 seconds
  //aggregations.subscriptions(up/down) //all
  //payment-links.currentSubscriptionsCount(up/down) //active
  //customers.currentSubscriptionsCount(up/down) //active
}

//Helper ================>
//creates aggregation document by merchantUID in firestore if doesn't exist
async function createAggregationMapIfNecessary(connectID: string) {
  try {
    const aggregationDoc = await db
      .collection('aggregations')
      .doc(connectID) //query by connect id since its unique
      .get();

    if (aggregationDoc.exists) {
      //if doc exists, no need to create it
      return;
    }

    //create if doc doesn't exist
    await db.collection('aggregations').doc(connectID).set({
      customerCount: 0,
      paymentLinkCount: 0,
      subscriptions: null,
      transactions: null,
    });

    functions.logger.log('created necessary agg map');

    return;
  } catch (error) {
    throw Error(error);
  }
}

function getOnlyChimpChargeData(data: any) {
  //return only objects with chimp charge metadata
  if (data.metadata.chimp_charge_firebase_merchant_uid) {
    return data;
  }
}
