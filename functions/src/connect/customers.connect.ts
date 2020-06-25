//import * as functions from 'firebase-functions';

import Stripe from 'stripe';
import { stripe } from '../config';

// // export const getCustomers = functions.https.onCall(async (data, context) => {});

export async function getOrCreateCustomer(
  customerParams: Stripe.CustomerCreateParams,
  merchantUID: string,
  connectID: string
) {
  try {
    const findCustomer = await stripe.customers.list(
      {
        email: customerParams.email,
      },
      { stripeAccount: connectID }
    );

    if (findCustomer.data.length == 0) {
      //create customer

      const createdCustomer = await stripe.customers.create(
        {
          email: customerParams.email,
          metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
          ...customerParams,
        },
        {
          stripeAccount: connectID,
        }
      );

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
      {
        stripeAccount: connectID,
      }
    );

    return updatedCustomer;
  } catch (err) {
    throw new Error('stripe: updateCustomerMetadata: ' + err);
  }
}

//TODO: eliminate customer duplication, when customer checks out, check database to see if there is an email with that customer, if there is no email, create a new one, if there is an email, use the current customer to not create a new one. 1. johnny@gmail.com + 2. johnny@gmail.com == one same person; Make sure your integration keeps a 1 to 1 mapping of user in your database to customer in Stripe.
