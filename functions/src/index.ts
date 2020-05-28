//import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export * as connect from './connect/connect.api';
//export * as stripe from './stripe/stripe.api';
export { connectStandardIntegration } from './connect/connect-auth';
