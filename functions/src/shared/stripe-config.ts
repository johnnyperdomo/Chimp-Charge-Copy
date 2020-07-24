import * as functions from 'firebase-functions';
import * as Stripe from 'stripe';
const config = functions.config();

//Stripe =====================>

export const stripe = new Stripe.Stripe(config.stripe.secret, {
  apiVersion: '2020-03-02',
  maxNetworkRetries: 2, // Retry a request twice before giving up
});

export const stripe_client_id = config.stripe.client_id;
export const stripe_webhook_connect_secret =
  config.stripe.webhook_connect_secret;
export const stripe_webhook_merchant_secret =
  config.stripe.webhook_merchant_secret;

//Stripe merchant
export const monthly_pro_price_id = config.stripe.monthly_pro_price_id;
