import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MembershipFieldType } from '../shared/extensions';
import { stripe, monthly_pro_price_id } from '../shared/stripe-config';
import {
  updateCustomerDefaultPaymentMethodMerchant,
  getOrCreateCustomerMerchant,
} from './customers.merchant';

const db = admin.firestore();
const auth = admin.auth();

//Stripe ==============>

// 7 day free trial subscription
export async function startTrialSubscription(data: any, userID: string) {
  const paymentMethodID: string = data.paymentMethodID;
  const chargeIdempotencyKey: string = data.chargeIdempotencyKey;

  try {
    const merchantRef = db.doc(`merchants/${userID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data()!;

    const stripeCustomerID = merchantData.customerID;

    // 'setup intent for trial' function already gets or creates a customer
    if (!stripeCustomerID) {
      throw Error('Could not find stripe customer ID');
    }

    const customer = (await stripe.customers.retrieve(
      stripeCustomerID
    )) as Stripe.Customer;

    await updateCustomerDefaultPaymentMethodMerchant(
      customer.id,
      paymentMethodID
    );

    //create subscription in stripe
    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: monthly_pro_price_id }],
        trial_period_days: 7, //7 day free trial
        expand: ['latest_invoice.payment_intent'],
      },
      { idempotencyKey: chargeIdempotencyKey }
    );

    // only add successful subscription
    if (
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    ) {
      await addSubscriptionOnFirestoreMembership(subscription);
    }

    // override previous membership details with new subscription details in firestore doc
    return subscription;
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error);
  }
}

// to handle sca, then create subscription
export async function createSetupIntentForTrial(data: any, userID: string) {
  const paymentMethodID: string = data.paymentMethodID;
  const newCustomerIdempotencyKey: string = data.newCustomerIdempotencyKey;

  try {
    const merchantRef = db.doc(`merchants/${userID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data()!;

    let stripeCustomerID = merchantData.customerID;

    //if stripeCustomerID doesn't exist, get or create from stripe
    if (!stripeCustomerID) {
      const businessName = merchantData.businessName;
      const email = (await auth.getUser(userID)).email!;
      const name = `${merchantData.firstName} ${merchantData.lastName}`;

      const stripeCustomer = await getOrCreateCustomerMerchant(
        email,
        name,
        businessName,
        userID,
        newCustomerIdempotencyKey
      );

      stripeCustomerID = stripeCustomer.id; //reassign variable

      await merchantRef.update({
        customerID: stripeCustomer.id,
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      payment_method: paymentMethodID,
      customer: stripeCustomerID,
    });

    return setupIntent;
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error);
  }
}

//when user updates card on paywall, retrieve latest payment intent of subscription to attempt to pay the latest invoice.
export async function retrieveLatestPaymentIntent(data: any, userID: string) {
  const paymentMethodID: string = data.paymentMethodID;
  const newCustomerIdempotencyKey: string = data.newCustomerIdempotencyKey;

  try {
    const merchantRef = db.doc(`merchants/${userID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data()!;

    let stripeCustomerID = merchantData.customerID;

    const subscriptionID =
      merchantData.membership && merchantData.membership.subscriptionID;

    if (!subscriptionID) {
      throw Error('Subscription ID not found');
    }

    //if stripeCustomerID doesn't exist, get or create from stripe
    if (!stripeCustomerID) {
      const businessName = merchantData.businessName;
      const email = (await auth.getUser(userID)).email!;
      const name = `${merchantData.firstName} ${merchantData.lastName}`;

      const stripeCustomer = await getOrCreateCustomerMerchant(
        email,
        name,
        businessName,
        userID,
        newCustomerIdempotencyKey
      );

      stripeCustomerID = stripeCustomer.id; //reassign variable

      await merchantRef.update({
        customerID: stripeCustomer.id,
      });
    }

    const customer = (await stripe.customers.retrieve(
      stripeCustomerID
    )) as Stripe.Customer;

    await stripe.paymentMethods.attach(paymentMethodID, {
      customer: customer.id,
    });

    await updateCustomerDefaultPaymentMethodMerchant(
      customer.id,
      paymentMethodID
    );

    //get subscription in stripe from id
    const retrievedSubscription = await stripe.subscriptions.retrieve(
      subscriptionID,
      {
        expand: ['latest_invoice.payment_intent'],
      }
    );

    return retrievedSubscription;
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error);
  }
}

// if user reactivates from the cancelled state
export async function reactivateSubscription(data: any, userID: string) {
  const paymentMethodID: string = data.paymentMethodID;
  const chargeIdempotencyKey: string = data.chargeIdempotencyKey;
  const newCustomerIdempotencyKey: string = data.newCustomerIdempotencyKey;

  try {
    const merchantRef = db.doc(`merchants/${userID}`);
    const merchantSnap = await merchantRef.get();
    const merchantData = merchantSnap.data()!;

    let stripeCustomerID = merchantData.customerID;

    if (!stripeCustomerID) {
      const businessName = merchantData.businessName;
      const email = (await auth.getUser(userID)).email!;
      const name = `${merchantData.firstName} ${merchantData.lastName}`;

      const stripeCustomer = await getOrCreateCustomerMerchant(
        email,
        name,
        businessName,
        userID,
        newCustomerIdempotencyKey
      );

      stripeCustomerID = stripeCustomer.id; //reassign variable

      await merchantRef.update({
        customerID: stripeCustomer.id,
      });
    }

    const customer = (await stripe.customers.retrieve(
      stripeCustomerID
    )) as Stripe.Customer;

    await stripe.paymentMethods.attach(paymentMethodID, {
      customer: customer.id,
    });

    await updateCustomerDefaultPaymentMethodMerchant(
      customer.id,
      paymentMethodID
    );

    //create subscription in stripe
    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: monthly_pro_price_id }],
        expand: ['latest_invoice.payment_intent'],
      },
      { idempotencyKey: chargeIdempotencyKey }
    );

    // only add successful subscription
    if (
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    ) {
      await addSubscriptionOnFirestoreMembership(subscription);
    }

    // override previous membership details with new subscription details in firestore doc
    return subscription;
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error);
  }
}

// on create subscription for merchant
export async function addSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchantByCustomerID = await db
      .collection('merchants')
      .where('customerID', '==', subscription.customer as String)
      .get();

    // if can't find merchant by customerID
    if (findMerchantByCustomerID.docs.length === 0) {
      return;
    }

    const currentMembership: MembershipFieldType | null = findMerchantByCustomerID.docs[0].data()
      .membership;

    // get the sub id of doc if it exists
    const currentSubID = currentMembership && currentMembership.subscriptionID;

    // check if subID has already been written to doc
    if (currentSubID === subscription.id) {
      return;
    }

    const merchantRef = findMerchantByCustomerID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}

// on update subscription for merchant
export async function updateSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchantBySubscriptionID = await db
      .collection('merchants')
      .where('membership.subscriptionID', '==', subscription.id)
      .get();

    // if can't find merchant by subID

    if (findMerchantBySubscriptionID.docs.length === 0) {
      return;
    }

    const merchantRef = findMerchantBySubscriptionID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}

// on cancel subscription for merchant
export async function cancelSubscriptionOnFirestoreMembership(
  subscription: Stripe.Subscription
) {
  try {
    const findMerchantBySubscriptionID = await db
      .collection('merchants')
      .where('membership.subscriptionID', '==', subscription.id)
      .get();

    // if can't find merchant by subID
    if (findMerchantBySubscriptionID.docs.length === 0) {
      return;
    }

    const currentMembership: MembershipFieldType | null = findMerchantBySubscriptionID.docs[0].data()
      .membership;

    // get the sub id of doc if it exists
    const currentStatus = currentMembership && currentMembership.status;

    // check if status has already been cancelled in doc; prevent duplicate write events
    if (currentStatus === 'canceled') {
      return;
    }

    const merchantRef = findMerchantBySubscriptionID.docs[0].ref;

    const membershipField: MembershipFieldType = {
      subscriptionID: subscription.id,
      subscriptionItemID: subscription.items.data[0].id,
      status: subscription.status,
      interval: subscription.items.data[0].plan.interval,
    };

    return merchantRef.update({
      membership: membershipField,
    });
  } catch (error) {
    throw Error(error);
  }
}
