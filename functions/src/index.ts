//import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export * as connect from './connect/api.connect';
//export * as stripe from './stripe/stripe.api';
export { connectStandardIntegration } from './connect/auth.connect';

//TODO: sendgrid send email on stripe webhooks
//TODO: export .connect functions

//TODO: don't forget to add idempotency key for-stripe, firebase{}
