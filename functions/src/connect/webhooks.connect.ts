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
  refundFirestoreTransaction,
} from './transactions.connect';
import { stripe } from '../config';
import {
  createFirestoreSubscription,
  updateFirestoreSubscription,
} from './subscriptions.connect';
import { deauthorizeStripeAccountWebhook } from './auth.connect';
import { stripeEventType } from '../helpers';
import { aggregateCustomer } from './aggregations.connect';

//TODO:
export async function handleStripeConnectWebhooks(event: Stripe.Event) {
  if (!event.account) {
    return;
  }

  const connectID = event.account;
  const eventID = event.id;
  const eventObject = event.data.object;

  try {
    //TODO: take into account batch or transaction for multiple update values
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

        return;
      case 'charge.refunded':
        //FUTURE-UPDATE: handle failed refund webhooks; send email to merchant that refund failed
        const chargeRefunded = eventObject as Stripe.Charge;

        if (chargeRefunded.refunded === false) {
          return;
        }

        await validateStripeWebhook(event, 'charge', connectID);
        await refundFirestoreTransaction(chargeRefunded);

        //aggregatePaymentIntent(down)

        //TODO: sendgrid
        return;
      //
      //Customer Events ===========================>
      //
      //TODO: update customer for subscription

      case 'customer.created':
      case 'customer.updated':
        const customerUpdated = eventObject as Stripe.Customer;
        const customerUpdatedMerchantUID = await validateStripeWebhook(
          event,
          'customer'
        );

        //creates customer if necessary
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

        await aggregateCustomer(connectID);

        return;
      //
      //PaymentLink Events (Products/Prices) ==================>
      //
      //TODO: update product/price for subscription
      case 'product.updated':
        const productUpdated = eventObject as Stripe.Product;
        await validateStripeWebhook(event, 'product');
        await updateFirestoreProductFromWebhook(productUpdated, connectID);

        return;
      case 'price.updated': //user can't update price from chimp_charge, but they can from stripe dashboard
        const priceUpdated = eventObject as Stripe.Price;
        await validateStripeWebhook(event, 'price');
        await updateFirestorePriceFromWebhook(priceUpdated, connectID);

        return;
      case 'product.deleted':
        const productDeleted = eventObject as Stripe.Product;
        await validateStripeWebhook(event, 'product');
        await deletePaymentLinkFromWebhook(connectID, productDeleted);

        return;
      case 'price.deleted':
        const deletedPrice = eventObject as Stripe.Price;
        await validateStripeWebhook(event, 'price');
        await deletePaymentLinkFromWebhook(connectID, undefined, deletedPrice);

        return;
      //
      //Subscription Events ==================>
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

        return;
      // FUTURE-UPDATE: case 'invoice.payment_failed':
      //   //FUTURE-UPDATE: validate
      //   //FUTURE-UPDATE: handle this failure

      //   return;
      //Subscriptions
      case 'customer.subscription.created':
        //only active or trialing === success
        const subscriptionCreated = eventObject as Stripe.Subscription;
        if (
          !(
            subscriptionCreated.status === 'active' ||
            subscriptionCreated.status === 'trialing'
          )
        ) {
          return;
        }

        const subscriptionCreatedMechantUID = await validateStripeWebhook(
          event,
          'subscription'
        );

        await createFirestoreSubscription(
          subscriptionCreated,
          connectID,
          subscriptionCreatedMechantUID,
          eventID
        );

        //aggregateSubscription(up)
        //TODO: sendgrid
        return;

      case 'customer.subscription.updated':
        const subscriptionUpdated = eventObject as Stripe.Subscription;

        const subscriptionUpdatedMerchantUID = await validateStripeWebhook(
          event,
          'subscription'
        );

        await updateFirestoreSubscription(
          subscriptionUpdated,
          connectID,
          eventID,
          subscriptionUpdatedMerchantUID
        );

        // TODO:sendgrid send sendgrid email, to customer on payment failure-> updated payment method, contact merchant for help
        //FUTURE-UPDATE: handle this failure
        return;
      case 'customer.subscription.deleted':
        const subscriptionDeleted = eventObject as Stripe.Subscription;

        await validateStripeWebhook(event, 'subscription');

        await updateFirestoreSubscription(
          subscriptionDeleted,
          connectID,
          eventID
        );
        //aggregateSubscription(down)

        //TODO: sendgrid
        return;

      case 'account.application.deauthorized':
        //FUTURE-UPDATE: Send email about deauthorized account,
        //FUTURE-UPDATE send email about new authorized account as well
        await deauthorizeStripeAccountWebhook(connectID);

        return;
      default:
        return;
    }
  } catch (err) {
    throw new Error(err);
  }
}

//ensures this webhook is associated with chimp charge

async function validateStripeWebhook(
  stripeEvent: Stripe.Event,
  eventType: stripeEventType,
  connectID?: string
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

      case 'charge':
        const chargeObject = stripeObject as Stripe.Charge;

        //if invoice exists, proceed with its metadata
        if (chargeObject.invoice) {
          const chargeInvoice = await stripe.invoices.retrieve(
            chargeObject.invoice as string,
            { stripeAccount: connectID }
          );

          const chargeInvoiceLine = chargeInvoice.lines.data[0];

          if (!chargeInvoiceLine.metadata.chimp_charge_firebase_merchant_uid) {
            throw Error('Could not validate stripe webhook for invoice');
          }

          return chargeInvoiceLine.metadata.chimp_charge_firebase_merchant_uid;
        }

        //else, get metadata directly from refund object
        if (!chargeObject.metadata.chimp_charge_firebase_merchant_uid) {
          throw Error('Could not validate stripe webhook for one time pay');
        }

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

//FUTURE-UPDATE: maybe create email funnels, when user first signs up, depending on webhook actions: i.e. step by step guide using sendbox email template
