import { stripe } from '../shared/stripe-config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

export async function getOrCreateCustomerMerchant(
  email: string,
  name: string,
  businessName: string,
  merchantUID: string,
  idempotencyKey: string
) {
  try {
    const findCustomer = await stripe.customers.list({
      email,
    });

    // if customer doesn't exist, create a new one
    if (findCustomer.data.length === 0) {
      const createdCustomer = await stripe.customers.create(
        {
          email,
          name,
          metadata: {
            chimp_charge_firebase_merchant_uid: merchantUID,
            chimp_charge_firebase_business_name: businessName,
          },
        },
        { idempotencyKey }
      );

      return createdCustomer;
    } else {
      const retrievedCustomer = findCustomer.data[0];
      const { chimp_charge_firebase_merchant_uid } = retrievedCustomer.metadata;

      // if customer exists with the same metadata => return
      if (
        chimp_charge_firebase_merchant_uid &&
        chimp_charge_firebase_merchant_uid === merchantUID
      ) {
        return retrievedCustomer;
      }

      // update customer in stripe
      return await stripe.customers.update(retrievedCustomer.id, {
        email,
        name,
        metadata: {
          chimp_charge_firebase_merchant_uid: merchantUID,
          chimp_charge_firebase_business_name: businessName,
        },
      });
    }
  } catch (err) {
    throw Error(err);
  }
}

export async function updateStripeCustomerEmailMerchant(
  data: any,
  userID: string
) {
  const email = data.email;

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

    return stripe.customers.update(stripeCustomerID, {
      email,
    });
  } catch (error) {
    throw Error();
  }
}

export async function updateStripeCustomerNameMerchant(
  data: any,
  userID: string
) {
  const name = data.name;
  const businessName = data.businessName;

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

    return stripe.customers.update(stripeCustomerID, {
      name,
      metadata: { chimp_charge_firebase_business_name: businessName },
    });
  } catch (error) {
    throw Error();
  }
}

export async function updateCustomerDefaultPaymentMethodMerchant(
  customerID: string,
  paymentMethodID: string
) {
  try {
    const updatedCustomer = await stripe.customers.update(customerID, {
      invoice_settings: {
        default_payment_method: paymentMethodID,
      },
    });

    return updatedCustomer;
  } catch (error) {
    throw Error('stripe: updateCustomerDefaultPaymentMethodMerchant: ' + error);
  }
}
