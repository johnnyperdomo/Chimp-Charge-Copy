import * as admin from 'firebase-admin';

admin.initializeApp();

export * as connect from './connect/api.connect';
export { connectStandardIntegration } from './connect/auth.connect';
export * as paymentLinks from './connect/payment-links.connect';

//TODO: sendgrid send email on stripe webhooks
//TODO: export .connect functions

//TODO: don't forget to add idempotency key for-stripe, firebase{} for 'post', not 'put,get,delete'

//TODO: when retrieving items, auto pagination to get all list items - autoPagingToArray - https://github.com/stripe/stripe-node

//NEXT-UPDATE: add stricter static typing, especially when it has to do with callable functions, with return 'data: any'. Overall code in general
//NEXT-UPDATE: firebase data - {lastUpdated: unix epoch}, add new timestamp when you receive webhook events, so that front end can listen to changes and update ui accordingly, // admin.firestore.Timestamp.now();?
