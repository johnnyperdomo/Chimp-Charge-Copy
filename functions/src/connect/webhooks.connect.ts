import Stripe from 'stripe';
import { updateFirestoreCustomer } from './customers.connect';
import * as functions from 'firebase-functions';
import {
  updateFirestoreProductFromWebhook,
  updateFirestorePriceFromWebhook,
  deletePaymentLinkFromWebhook,
} from './payment-links.connect';
import {
  createFirestoreTransaction,
  updateFirestoreTransaction,
  createFirestoreTransactionFromInvoice,
} from './transactions.connect';

//TODO:
export async function handleStripeConnectWebhooks(event: Stripe.Event) {
  if (!event.account) {
    return;
  }
  const connectID = event.account;
  const eventID = event.id;
  const eventObject = event.data.object;

  try {
    //TODO: account deauthorized payment intent
    //ensures this webhook is associated with chimp charge
    const merchantUID = await validateStripeWebhook(event);

    switch (event.type) {
      //4 Event Categories
      //
      //Transaction Events ========================>
      //
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = eventObject as Stripe.PaymentIntent;

        await createFirestoreTransaction(
          paymentIntentSucceeded.id,
          connectID,
          merchantUID,
          eventID
        );
        //aggregatePaymentIntents(up)

        //::::if payment_intent has an invoice value(=== subscription), retrieve invoice so you can get metadata, update payment_Intent with new metadata, and then execute function as normal, with updated payment_intent

        return;
      case 'charge.refunded':
        //updateFirestoreTransaction, payment intent to refunded === true
        //transaction ==> .isRefunded: true
        //aggregatePaymentIntent(down)

        //TODO: sendgrid
        return;
      //
      //Customer Events ===========================>
      //
      case 'customer.updated':
        const customerUpdated = eventObject as Stripe.Customer;

        await updateFirestoreCustomer(
          customerUpdated,
          connectID,
          eventID,
          false,
          merchantUID
        );

        return;
      case 'customer.deleted':
        const customerDeleted = eventObject as Stripe.Customer;

        await updateFirestoreCustomer(
          customerDeleted,
          connectID,
          eventID,
          true
        );

        return;
      //
      //PaymentLink Events (Products/Prices) ==================>
      //
      case 'product.updated':
        const productUpdated = eventObject as Stripe.Product;
        await updateFirestoreProductFromWebhook(productUpdated);

        return;
      case 'price.updated': //user can't update price from chimp_charge, but they can from stripe dashboard
        const priceUpdated = eventObject as Stripe.Price;
        await updateFirestorePriceFromWebhook(priceUpdated);

        return;
      case 'product.deleted':
        const productDeleted = eventObject as Stripe.Product;
        await deletePaymentLinkFromWebhook(productDeleted);

        //TODO: aggregate(down)
        return;
      case 'price.deleted':
        const deletedPrice = eventObject as Stripe.Price;
        await deletePaymentLinkFromWebhook(undefined, deletedPrice);

        //TODO: aggregate(down)

        return;
      //
      //Subscription Events ==================> //TODO:
      //

      case 'invoice.payment_succeeded':
        const invoicePaymentSucceeded = eventObject as Stripe.Invoice;
        await createFirestoreTransactionFromInvoice(
          invoicePaymentSucceeded,
          connectID,
          merchantUID,
          eventID
        );
        //FUTURE-UPDATE: handle this failure
        // TODO:sendgrid send sendgrid email, to customer -> updated payment method, contact merchant for help

        return;
      case 'invoice.payment_failed':
        //FUTURE-UPDATE: handle this failure
        // TODO:sendgrid send sendgrid email, to customer -> updated payment method, contact merchant for help

        return;
      //Subscriptions
      case 'customer.subscription.created':
        //create firestore subscription
        //aggregateSubscription(up)
        //TODO: sendgrid
        return;

      case 'customer.subscription.updated':
        //update firestore subscription

        return;
      case 'customer.subscription.deleted':
        //update firestore subscription -> cancelled
        //aggregateSubscription(down)

        //TODO: sendgrid
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
async function validateStripeWebhook(stripeEvent: Stripe.Event) {
  try {
    const stripeObject: any = stripeEvent.data.object;

    switch (stripeEvent.type) {
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        const invoiceObject = stripeObject as Stripe.Invoice;
        const invoiceLine = invoiceObject.lines.data[0];

        return invoiceLine.metadata.chimp_charge_firebase_merchant_uid;
      default:
        return stripeObject.metadata.chimp_charge_firebase_merchant_uid;
    }

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
