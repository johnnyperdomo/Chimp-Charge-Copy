import * as functions from 'firebase-functions';
import { stripe } from '../config';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const connectStandardIntegration = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'The function must be called ' + 'while authenticated.'
      );
    }

    try {
      const userId = context.auth?.uid;
      const userRef = db.doc(`merchants/${userId}`);

      const stripeResponse = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code: data.authorization_code,
      });

      const newStripeConnectID = stripeResponse.stripe_user_id;
      await userRef.update({ stripeConnectID: newStripeConnectID });

      return stripeResponse;
    } catch (err) {
      console.log(err);

      throw new functions.https.HttpsError('unknown', err);
    }

    //get token, update firebase user
  }
);
