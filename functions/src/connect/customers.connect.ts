import Stripe from 'stripe';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
const db = admin.firestore();

// // export const getCustomers = functions.https.onCall(async (data, context) => {});

export async function getOrCreateCustomer(
  customerParams: Stripe.CustomerCreateParams,
  merchantUID: string,
  connectID: string,
  newCustomerIdempotencyKey: string
) {
  try {
    const findCustomer = await stripe.customers.list(
      {
        email: customerParams.email,
      },
      { stripeAccount: connectID }
    );

    if (findCustomer.data.length === 0) {
      //create customer

      const eventIDQuery = await db
        .collection('customers')
        .where('eventID', '==', newCustomerIdempotencyKey)
        .get();

      if (!(eventIDQuery.docs.length === 0)) {
        //if eventID already exists, function has already been processed

        throw new Error("Error: Couldn't create customer, already created.");
      }

      const createdCustomer = await stripe.customers.create(
        {
          email: customerParams.email,
          metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
          ...customerParams,
        },
        { stripeAccount: connectID, idempotencyKey: newCustomerIdempotencyKey }
      );

      //add customer to firestore
      await db.collection('customers').add({
        lastUpdated: admin.firestore.Timestamp.now(),
        customer: createdCustomer,
        merchantUID: merchantUID,
        connectID: connectID,
        isDeleted: false,
        eventID: newCustomerIdempotencyKey, //check if this event has already been processed
      });

      return createdCustomer;
    } else {
      //update and return old customer
      const oldCustomerID = findCustomer.data[0].id;
      const updatedCustomer = await updateCustomerMetadata(
        oldCustomerID,
        merchantUID,
        connectID
      );
      return updatedCustomer;
    }
  } catch (err) {
    throw new Error('stripe: getOrCreateCustomer: ' + err);
  }
}

async function updateCustomerMetadata(
  customerID: string,
  merchantUID: string,
  connectID: string
) {
  try {
    const updatedCustomer = await stripe.customers.update(
      customerID,
      {
        metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
      },
      { stripeAccount: connectID }
    );

    return updatedCustomer;
  } catch (err) {
    throw new Error('stripe: updateCustomerMetadata: ' + err);
  }
}

export async function updateCustomerDefaultPaymentMethod(
  customerID: string,
  connectID: string,
  paymentMethodID: string
) {
  try {
    const updatedCustomer = await stripe.customers.update(
      customerID,
      {
        invoice_settings: {
          default_payment_method: paymentMethodID,
        },
      },
      { stripeAccount: connectID }
    );

    return updatedCustomer;
  } catch (error) {
    console.error('updated customer', error);
    throw new Error('stripe: updateCustomerDefaultPaymentMethod: ' + error);
  }
}
