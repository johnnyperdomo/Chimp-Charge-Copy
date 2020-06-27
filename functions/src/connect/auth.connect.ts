import * as functions from 'firebase-functions';
import { stripe } from '../config';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export async function connectStandardIntegration(data: any, userID: string) {
  try {
    const userId = userID;
    const userRef = db.doc(`merchants/${userId}`);

    const stripeResponse = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: data.authorization_code,
    });

    const newStripeConnectID = stripeResponse.stripe_user_id;
    await userRef.update({ connectID: newStripeConnectID });

    return stripeResponse;
  } catch (err) {
    console.log(err);

    throw new functions.https.HttpsError('unknown', err);
  }
}
