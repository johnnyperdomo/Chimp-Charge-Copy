import Stripe from 'stripe';
import { updateFirestoreCustomer } from './customers.connect';
import * as functions from 'firebase-functions';

//TODO:
export async function handleStripeConnectWebhooks(event: Stripe.Event) {
  if (!event.account) {
    return;
  }
  const connectID = event.account;
  const eventID = event.id;

  try {
    switch (event.type) {
      //4 Event Categories
      //
      //Transaction Events ========================>
      //
      case 'payment_intent.succeeded':
        //createFirestoreTransaction
        //aggregatePaymentIntents(up)

        //::::if payment_intent has an invoice value(=== subscription), retrieve invoice so you can get metadata, update payment_Intent with new metadata, and then execute function as normal, with updated payment_intent

        return;
      case 'payment_intent.updated':
        //update firestore transaction

        //::::if payment_intent has an invoice value(=== subscription), retrieve invoice so you can get metadata, update payment_Intent with new metadata, and then execute function as normal, with updated payment_intent

        return;
      case 'charge.refunded':
        //updateFirestoreTransaction, payment intent to refunded === true
        //aggregatePaymentIntent(down)

        return;
      //
      //Customer Events ===========================>
      //
      case 'customer.updated':
        const updatedCustomer = event.data.object as Stripe.Customer;
        const updatedMerchantCustomer = await validateStripeWebhookFor(
          'customer',
          updatedCustomer
        );

        await updateFirestoreCustomer(
          updatedCustomer,
          connectID,
          eventID,
          false,
          updatedMerchantCustomer
        );

        return;
      case 'customer.deleted':
        //::make firestore customer false, archive customer
        const deletedCustomer = event.data.object as Stripe.Customer;
        await validateStripeWebhookFor('customer', deletedCustomer);

        await updateFirestoreCustomer(
          deletedCustomer,
          connectID,
          eventID,
          true
        );

        return;
      //
      //PaymentLink Events (Products/Prices) ==================>
      //
      case 'product.updated':
        //updatePaymentLink, else if product.isActive = false => delete

        return;
      case 'price.updated': //user can't update price from chimp_charge, but they can from stripe dashboard
        //updatePaymentLink, else if price.isActive = false => delete

        return;
      case 'product.deleted':
      case 'price.deleted':
        //::payment-link.onDeletePaymentLink

        return;
      //
      //Subscription Events ==================> //TODO:
      //
      case 'invoice.payment_failed':
        //FUTURE-UPDATE: handle this failure
        // send sendgrid email, to customer -> updated payment method, contact merchant for help

        return;
      //Subscriptions
      case 'customer.subscription.created':
        //create firestore subscription
        //aggregateSubscription()
        return;

      case 'customer.subscription.updated':
        //update firestore subscription

        return;
      case 'customer.subscription.deleted':
        //update firestore subscription -> cancelled
        //aggregateSubscription(down)

        return;
      default:
        return;
    }
  } catch (err) {
    throw new Error(err);
  }
}

type stripeEventType =
  | 'transaction'
  | 'customer'
  | 'payment-link'
  | 'subscription';
async function validateStripeWebhookFor(
  eventType: stripeEventType,
  eventObject: Stripe.Event.Data.Object
) {
  try {
    switch (eventType) {
      case 'customer':
        const customer = eventObject as Stripe.Customer;
        const customerMerchantUID =
          customer.metadata.chimp_charge_firebase_merchant_uid;

        if (!customerMerchantUID) {
          functions.logger.error({ error: 'Webhook could not be validated' });
          throw Error('Webhook could not be validated');
        }

        return customerMerchantUID;
      default:
        throw Error('Webhook could not be validated');
    }
  } catch (err) {
    throw Error(err);
  }
}
