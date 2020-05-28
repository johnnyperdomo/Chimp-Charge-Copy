import * as functions from 'firebase-functions';
import * as Stripe from 'stripe';

export const stripe = new Stripe.Stripe(functions.config().stripe.secret, {
  apiVersion: '2020-03-02',
});
