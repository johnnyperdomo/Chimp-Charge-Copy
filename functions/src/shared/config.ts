import * as functions from 'firebase-functions';
import * as Stripe from 'stripe';

//Stripe =====================>

export const stripe = new Stripe.Stripe(functions.config().stripe.secret, {
  apiVersion: '2020-03-02',
  maxNetworkRetries: 2, // Retry a request twice before giving up
});

export const stripeClientID = functions.config().stripe.clientid;
export const stripeWebhookConnectSecret = functions.config().stripe
  .webhookconnectsecret;
export const stripeWebhookMerchantSecret = functions.config().stripe
  .webhookmerchantsecret;

//Stripe merchant
export const monthlyProPriceID = functions.config().stripe.monthlypropriceid;

//TODO: Sendgrid ====================>
