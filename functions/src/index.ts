//import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
//import * as Stripe from 'stripe';

admin.initializeApp();

// export const stripe = new Stripe.Stripe(functions.config().stripe.secret, {
//   apiVersion: '2020-03-02',
// }); //uncaught error from firebase

export * as connect from './connect.api';
