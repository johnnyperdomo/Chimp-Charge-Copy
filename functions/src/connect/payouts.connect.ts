import { stripe } from '../shared/stripe-config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

export async function getStripePayouts(userID: string) {
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

    const payouts = await stripe.payouts
      .list(
        { expand: ['data.destination'] },
        { stripeAccount: stripeConnectID }
      )
      .autoPagingToArray({ limit: 1000 });

    return payouts;
  } catch (error) {
    throw error;
  }
}

export async function getStripeBalance(userID: string) {
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

    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeConnectID,
    });

    return balance;
  } catch (error) {
    throw error;
  }
}
