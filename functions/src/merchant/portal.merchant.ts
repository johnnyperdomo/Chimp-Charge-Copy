import { stripe } from '../shared/stripe-config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

//to handle subscription billing for merchant with stripe
export async function onCreateBillingPortalSession(userID: string) {
  try {
    const userRef = db.doc(`merchants/${userID}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data()!;

    const stripeCustomerID = userData.customerID;

    if (!stripeCustomerID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Stripe Customer ID not found'
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerID,
    });

    return portalSession;
  } catch (error) {
    throw Error(error);
  }
}
