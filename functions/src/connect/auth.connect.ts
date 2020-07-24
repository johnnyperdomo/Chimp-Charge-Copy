import * as functions from 'firebase-functions';
import { stripe } from '../shared/stripe-config';
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

export async function deauthorizeStripeAccountWebhook(connectID: string) {
  try {
    const findAssociatedAccount = await db
      .collection('merchants')
      .where('connectID', '==', connectID)
      .get();

    if (findAssociatedAccount.docs.length === 0) {
      return;
    }

    const accountRef = findAssociatedAccount.docs[0].ref;

    await accountRef.update({
      connectID: null, //remove connectID from merchant
    });

    return;
  } catch (error) {
    throw Error(error);
  }
}
