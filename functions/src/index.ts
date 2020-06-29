import * as admin from 'firebase-admin';

admin.initializeApp();

export { chimpApi } from './connect/api.connect';

//FUTURE-UPDATE: when retrieving items, auto pagination to get all list items - autoPagingToArray - https://github.com/stripe/stripe-node
//FUTURE-UPDATE: add stricter static typing, especially when it has to do with callable functions, with return 'data: any'. Overall code in general
//FUTURE-UPDATE: firebase data - {lastUpdated: unix epoch}, add new timestamp when you receive webhook events, so that front end can listen to changes and update ui accordingly, // admin.firestore.Timestamp.now();?
//FUTURE-UPDATE: better server logging, error handling, error messages for client side, status codes
