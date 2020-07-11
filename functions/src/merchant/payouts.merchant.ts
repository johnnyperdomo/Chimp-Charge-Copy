import { stripe } from '../shared/config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

export async function getStripeMerchantPayouts(userID: string) {
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

  try {
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

export async function getStripeMerchantBalance(userID: string) {
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

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeConnectID,
    });

    return balance;
  } catch (error) {
    throw error;
  }
}
