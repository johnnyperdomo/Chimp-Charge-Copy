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
import { stripe } from '../shared/stripe-config';
import {
  createFirestoreSubscription,
  updateFirestoreSubscription,
  cancelFirestoreSubscription,
} from './subscriptions.connect';
import { deauthorizeStripeAccountWebhook } from './auth.connect';
import { stripeEventType } from '../shared/extensions';

export async function handleStripeConnectWebhooks(event: Stripe.Event) {
  if (!event.account) {
    return;
  }

  const connectID = event.account;
  const eventID = event.id;
  const eventObject = event.data.object;
  const previousAttributes = event.data.previous_attributes as any;

  try {
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

        return;
      case 'charge.refunded':
        //LATER: handle failed refund webhooks; send email to merchant that refund failed
        const chargeRefunded = eventObject as Stripe.Charge;

        if (chargeRefunded.refunded === false) {
          return;
        }

        const chargeRefundedMerchantUID = await validateStripeWebhook(
          event,
          'charge',
          connectID
        );
        await refundFirestoreTransaction(
          chargeRefunded,
          connectID,
          chargeRefundedMerchantUID
        );

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
        //customer will not be deleted in aggregation map
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
        const productUpdatedMerchantUID = await validateStripeWebhook(
          event,
          'product'
        );
        await updateFirestoreProductFromWebhook(
          productUpdated,
          connectID,
          productUpdatedMerchantUID
        );

        return;
      case 'price.updated': //user can't update price from chimp_charge, but they can from stripe dashboard
        const priceUpdated = eventObject as Stripe.Price;
        const priceUpdatedMerchantUID = await validateStripeWebhook(
          event,
          'price'
        );
        await updateFirestorePriceFromWebhook(
          priceUpdated,
          connectID,
          priceUpdatedMerchantUID
        );

        return;
      case 'product.deleted':
        const productDeleted = eventObject as Stripe.Product;
        const productDeletedMerchantUID = await validateStripeWebhook(
          event,
          'product'
        );
        await deletePaymentLinkFromWebhook(
          connectID,
          productDeletedMerchantUID,
          productDeleted
        );

        return;
      case 'price.deleted':
        const deletedPrice = eventObject as Stripe.Price;
        const priceDeletedMerchantUID = await validateStripeWebhook(
          event,
          'price'
        );
        await deletePaymentLinkFromWebhook(
          connectID,
          priceDeletedMerchantUID,
          undefined,
          deletedPrice
        );

        return;
      //
      //Subscription Events ==================>
      //
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
      // LATER: case 'invoice.payment_failed':
      //   //LATER: validate
      //   //LATER: handle this failure

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
          subscriptionUpdatedMerchantUID,
          previousAttributes && previousAttributes.status
        );

        return;
      case 'customer.subscription.deleted':
        const subscriptionDeleted = eventObject as Stripe.Subscription;

        const subscriptionDeletedMerchantUID = await validateStripeWebhook(
          event,
          'subscription'
        );
        await cancelFirestoreSubscription(
          subscriptionDeleted,
          connectID,
          subscriptionDeletedMerchantUID
        );

        return;

      case 'account.application.deauthorized':
        //LATER: Send email about deauthorized account,
        //LATER send email about new authorized account as well
        await deauthorizeStripeAccountWebhook(connectID);

        return;
      default:
        return;
    }
  } catch (err) {
    throw Error(err);
  }
}
//LATER: charge.dispute.created(send email to merchant to check their stripe account)
//LATER: charge.dispute.closed[lost](update firestore transaction)

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

//LATER: maybe create email funnels, when user first signs up, depending on webhook actions: i.e. step by step guide using sendbox email template
