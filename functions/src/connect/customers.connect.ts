import Stripe from 'stripe';
import { stripe } from '../shared/config';
import * as admin from 'firebase-admin';
import { customerFieldType } from '../shared/extensions';

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
          ...customerParams, //name is included here
        },
        { stripeAccount: connectID, idempotencyKey: newCustomerIdempotencyKey }
      );

      //customer should be created in firebase before completing payment, to make sure aggregation completes successfully
      await createFirestoreCustomer(
        createdCustomer,
        merchantUID,
        connectID,
        newCustomerIdempotencyKey
      );

      return createdCustomer;
    } else {
      //update and return existing customer
      const existingCustomerID = findCustomer.data[0].id;

      const updatedCustomer = await updateStripeCustomer(
        customerParams,
        existingCustomerID,
        merchantUID,
        connectID
      );

      //customer should be updated/created in firebase before completing payment, to make sure aggregation completes successfully
      await updateFirestoreCustomer(
        updatedCustomer,
        connectID,
        newCustomerIdempotencyKey,
        false,
        merchantUID
      );

      return updatedCustomer;
    }
  } catch (err) {
    throw new Error('stripe: getOrCreateCustomer: ' + err);
  }
}

async function updateStripeCustomer(
  customerParams: Stripe.CustomerCreateParams,
  customerID: string,
  merchantUID: string,
  connectID: string
) {
  try {
    const updatedCustomer = await stripe.customers.update(
      customerID,
      {
        metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
        ...customerParams,
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
      .where('customer.customerID', '==', stripeCustomer.id)
      .get();

    //if can't find customer in firestore, create one(only on update webhook)
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

      if (
        findCustomer.docs[0].data().isDeleted &&
        findCustomer.docs[0].data().isDeleted === true
      ) {
        //should not try to delete again if already deleted
        return;
      }

      const deletedCustomer: customerFieldType = {
        name: stripeCustomer.name,
        email: stripeCustomer.email,
        customerID: stripeCustomer.id,
        created: stripeCustomer.created,
      };

      await customerRef.update({
        isDeleted: true,
        customer: deletedCustomer,
        lastUpdated: admin.firestore.Timestamp.now(),
      });

      return;
    }

    const customerField: customerFieldType = {
      name: stripeCustomer.name,
      email: stripeCustomer.email,
      customerID: stripeCustomer.id,
      created: stripeCustomer.created,
    };

    await customerRef.update({
      customer: customerField,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    return;
  } catch (err) {
    throw Error(err);
  }
}

export async function createFirestoreCustomer(
  customer: Stripe.Customer,
  merchantUID: string,
  connectID: string,
  idempotencyKey: string
) {
  try {
    const eventIDQuery = await db
      .collection('customers')
      .where('eventID', '==', idempotencyKey)
      .get();

    if (eventIDQuery.docs.length !== 0) {
      //if eventID already exists, function has already been processed
      throw Error('This customer has already been created');
    }

    const customerField: customerFieldType = {
      name: customer.name,
      email: customer.email,
      customerID: customer.id,
      created: customer.created,
    };

    const newDoc = db.collection('customers').doc();
    const aggregationRef = db.collection('aggregations').doc(connectID);

    const increment = admin.firestore.FieldValue.increment(1);
    const batch = db.batch(); //atomic

    batch.set(newDoc, {
      lastUpdated: admin.firestore.Timestamp.now(),
      customer: customerField,
      merchantUID: merchantUID,
      connectID: connectID,
      isDeleted: false,
      eventID: idempotencyKey, //check if this event has already been processed
      activeSubscriptionsCount: 0,
      transactions: null,
    });

    batch.set(
      aggregationRef,
      { customerCount: increment, connectID, merchantUID },
      { merge: true }
    ); //aggregate customer count

    await batch.commit();

    return;
  } catch (err) {
    throw Error(err);
  }
}
