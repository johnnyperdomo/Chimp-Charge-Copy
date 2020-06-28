import Stripe from 'stripe';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
const db = admin.firestore();

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

      await createFirestoreCustomer(
        createdCustomer,
        merchantUID,
        connectID,
        newCustomerIdempotencyKey
      );

      return createdCustomer;
    } else {
      //update and return old customer
      //TODO: check to see if user exists in firestore db, if yes => just .get, else { updateStripeCus.then(createFirestoreCustomer) }

      const existingCustomerID = findCustomer.data[0].id;

      //TODO: test this function
      const updatedCustomer = await updateCustomerMetadata(
        existingCustomerID,
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

//Firestore ================>

export async function updateFirestoreCustomer(
  stripeCustomer: Stripe.Customer,

  connectID: string,
  eventID: string,
  willDelete: boolean = false,
  merchantUID?: string
) {
  try {
    const findCustomer = await db
      .collection('customers')
      .where('customer.id', '==', stripeCustomer.id)
      .get();

    //if can't find customer
    if (findCustomer.docs.length === 0) {
      if (!merchantUID) {
        return;
      }

      await createFirestoreCustomer(
        stripeCustomer,
        merchantUID,
        connectID,
        eventID
      );
      return;
    }

    const customerRef = findCustomer.docs[0].ref;

    if (willDelete === true) {
      //pseudo delete
      await customerRef.update({
        isDeleted: true,
        customer: stripeCustomer,
        lastUpdated: admin.firestore.Timestamp.now(),
      });
      return;
    }

    await customerRef.update({
      customer: stripeCustomer,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    return;
  } catch (err) {
    throw Error(err);
  }

  //TODO: we'll check if user exists in firestore, if he doesn't => create one, if he does ...edit him
}

export async function createFirestoreCustomer(
  customer: Stripe.Customer,
  merchantUID: string,
  connectID: string,
  idempotencyKey: string
) {
  //add customer to firestore

  try {
    await db.collection('customers').add({
      lastUpdated: admin.firestore.Timestamp.now(),
      customer,
      merchantUID: merchantUID,
      connectID: connectID,
      isDeleted: false,
      eventID: idempotencyKey, //check if this event has already been processed
      currentSubscriptionsCount: null,
      successfulTransactions: null,
    });
  } catch (err) {
    throw Error(err);
  }
}
