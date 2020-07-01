import Stripe from 'stripe';
import * as functions from 'firebase-functions';

import { updateFirestoreCustomer } from './customers.connect';
import {
  updateFirestoreProductFromWebhook,
  updateFirestorePriceFromWebhook,
  deletePaymentLinkFromWebhook,
} from './payment-links.connect';
import {
  createFirestoreTransaction,
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

    switch (event.type) {
      //4 Event Categories
      //
      //Transaction Events ========================>
      //
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = eventObject as Stripe.PaymentIntent;

        if (paymentIntentSucceeded.invoice) {
          return;
        }

        const paymentIntentSuccessMerchantUID = await validateStripeWebhook(
          event,
          'payment_intent'
        );

        await createFirestoreTransaction(
          paymentIntentSucceeded,
          connectID,
          paymentIntentSuccessMerchantUID,
          eventID
        );
        //aggregatePaymentIntents(up)

        //::::if payment_intent has an invoice value(=== subscription), retrieve invoice so you can get metadata, update payment_Intent with new metadata, and then execute function as normal, with updated payment_intent

        return;
      case 'charge.refunded':
        //TODO: validate
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
        const customerUpdatedMerchantUID = await validateStripeWebhook(
          event,
          'customer'
        );

        await updateFirestoreCustomer(
          customerUpdated,
          connectID,
          eventID,
          false,
          customerUpdatedMerchantUID
        );

        return;
      case 'customer.deleted':
        const customerDeleted = eventObject as Stripe.Customer;
        await validateStripeWebhook(event, 'customer');

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
        await validateStripeWebhook(event, 'product');
        await updateFirestoreProductFromWebhook(productUpdated);

        return;
      case 'price.updated': //user can't update price from chimp_charge, but they can from stripe dashboard
        const priceUpdated = eventObject as Stripe.Price;
        await validateStripeWebhook(event, 'price');
        await updateFirestorePriceFromWebhook(priceUpdated);

        return;
      case 'product.deleted':
        const productDeleted = eventObject as Stripe.Product;
        await validateStripeWebhook(event, 'product');
        await deletePaymentLinkFromWebhook(productDeleted);

        //TODO: aggregate(down)
        return;
      case 'price.deleted':
        const deletedPrice = eventObject as Stripe.Price;
        await validateStripeWebhook(event, 'price');
        await deletePaymentLinkFromWebhook(undefined, deletedPrice);

        //TODO: aggregate(down)

        return;
      //
      //Subscription Events ==================> //TODO:
      //
      //TODO: error for recurring payments
      case 'invoice.payment_succeeded':
        const invoicePaymentSucceeded = eventObject as Stripe.Invoice;
        const invoicePaymentSuccessMerchantUID = await validateStripeWebhook(
          event,
          'invoice'
        );

        await createFirestoreTransactionFromInvoice(
          invoicePaymentSucceeded,
          connectID,
          invoicePaymentSuccessMerchantUID,
          eventID
        );
        //FUTURE-UPDATE: handle this failure
        // TODO:sendgrid send sendgrid email, to customer -> updated payment method, contact merchant for help

        return;
      case 'invoice.payment_failed':
        //TODO: validate
        //FUTURE-UPDATE: handle this failure
        // TODO:sendgrid send sendgrid email, to customer -> updated payment method, contact merchant for help

        return;
      //Subscriptions
      case 'customer.subscription.created':
        //TODO: validate
        //create firestore subscription
        //aggregateSubscription(up)
        //TODO: sendgrid
        return;

      case 'customer.subscription.updated':
        //TODO: validate
        //update firestore subscription

        return;
      case 'customer.subscription.deleted':
        //TODO: validate
        //update firestore subscription -> cancelled
        //aggregateSubscription(down)

        //TODO: sendgrid
        return;

      case 'account.application.deauthorized':
        //
        return;
      default:
        return;
    }
  } catch (err) {
    throw new Error(err);
  }
}

type stripeEventType =
  | 'payment_intent'
  | 'invoice'
  | 'customer'
  | 'product'
  | 'price';

async function validateStripeWebhook(
  stripeEvent: Stripe.Event,
  eventType: stripeEventType
) {
  try {
    const stripeObject: any = stripeEvent.data.object;

    switch (eventType) {
      case 'invoice':
        const invoiceObject = stripeObject as Stripe.Invoice;
        const invoiceLine = invoiceObject.lines.data[0];

        if (!invoiceLine.metadata.chimp_charge_firebase_merchant_uid) {
          throw Error('Could not validate stripe webhook for invoice');
        }

        return invoiceLine.metadata.chimp_charge_firebase_merchant_uid;

      default:
        if (!stripeObject.metadata.chimp_charge_firebase_merchant_uid) {
          throw Error('Could not validate stripe webhook for one time pay');
        }
        return stripeObject.metadata.chimp_charge_firebase_merchant_uid;
    }
  } catch (err) {
    functions.logger.error(err);
    throw Error(err);
  }
}
