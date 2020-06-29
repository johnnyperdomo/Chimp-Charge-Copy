import Stripe from 'stripe';
import { updateFirestoreCustomer } from './customers.connect';
import * as functions from 'firebase-functions';
import {
  updateFirestoreProductFromWebhook,
  updateFirestorePriceFromWebhook,
  deletePaymentLinkFromWebhook,
} from './payment-links.connect';

//TODO:
export async function handleStripeConnectWebhooks(event: Stripe.Event) {
  if (!event.account) {
    return;
  }
  const connectID = event.account;
  const eventID = event.id;

  try {
    //ensures this webhook is associated with chimp charge
    const merchantUID = await validateStripeWebhook(event.data.object);

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
        //if metadata updates most likely
        //update firestore transaction

        //::::if payment_intent has an invoice value(=== subscription), retrieve invoice so you can get metadata, update payment_Intent with new metadata, and then execute function as normal, with updated payment_intent

        return;
      case 'charge.refunded':
        //updateFirestoreTransaction, payment intent to refunded === true
        //transaction ==> .isRefunded: true
        //aggregatePaymentIntent(down)

        return;
      //
      //Customer Events ===========================>
      //
      case 'customer.updated':
        const updatedCustomer = event.data.object as Stripe.Customer;

        await updateFirestoreCustomer(
          updatedCustomer,
          connectID,
          eventID,
          false,
          merchantUID
        );

        return;
      case 'customer.deleted':
        //::make firestore customer false, archive customer
        const deletedCustomer = event.data.object as Stripe.Customer;

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
        const updatedProduct = event.data.object as Stripe.Product;
        await updateFirestoreProductFromWebhook(updatedProduct);

        return;
      case 'price.updated': //user can't update price from chimp_charge, but they can from stripe dashboard
        const updatedPrice = event.data.object as Stripe.Price;
        await updateFirestorePriceFromWebhook(updatedPrice);

        return;
      case 'product.deleted':
        const deletedProduct = event.data.object as Stripe.Product;
        await deletePaymentLinkFromWebhook(deletedProduct);

        //TODO: aggregate(down)
        return;
      case 'price.deleted':
        const deletedPrice = event.data.object as Stripe.Price;
        await deletePaymentLinkFromWebhook(undefined, deletedPrice);

        //TODO: aggregate(down)

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
        //aggregateSubscription(up)
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

// type stripeEventType =
//   | 'transaction'
//   | 'customer'
//   | 'product'
//   | 'price'
//   | 'subscription';
async function validateStripeWebhook(eventObject: Stripe.Event.Data.Object) {
  try {
    const stripeObject: any = eventObject;

    const retrievedMerchantUID =
      stripeObject.metadata.chimp_charge_firebase_merchant_uid;

    if (!retrievedMerchantUID) {
      functions.logger.error({ error: 'Webhook could not be validated' });
      throw Error('Webhook could not be validated');
    }

    return retrievedMerchantUID;

    // switch (eventType) {
    //   case 'customer':

    //   case 'product':
    //     const product = eventObject as Stripe.Product;
    //     const productMerchantUID =
    //       product.metadata.chimp_charge_firebase_merchant_uid;

    //     if (!productMerchantUID) {
    //       functions.logger.error({ error: 'Webhook could not be validated' });
    //       throw Error('Webhook could not be validated');
    //     }

    //     return customerMerchantUID;
    //   default:
    //     throw Error('Webhook could not be validated');
    // }
  } catch (err) {
    throw Error(err);
  }
}
