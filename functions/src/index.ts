import * as admin from 'firebase-admin';
admin.initializeApp();

export { chimpApi } from './api';

export {
  sendWelcomeEmail,
  createStripeCustomerMerchant,
} from './triggers/triggers';

//TODO: 'active when ready to deploy app to production'
// export { warmApiRunner } from './task-runners';

//LATER: when retrieving items, auto pagination to get all list items - autoPagingToArray - https://github.com/stripe/stripe-node
//LATER: add stricter static typing,, with return 'data: any'. Overall code in general

//LATER: better server logging, error handling, error messages for client side, status codes

//LATER: only propagate temporary errors, like server errors, service downtown, or network errors. i.e., 'could not validate stripe webhook' should not be an error that we log in firebase,, but 'could not save data to firebase' could be a potential error we may want to pay attention to. we also don't have to log every error in firebase error console,(functions.https), only necessary ones that require our attention. so although an insufficient card does throw an error, just present it to user, but this is not an error that requires our attention[not a bug on server side, not our problem] => Error crashes cause more cold starts(because server instances are deallocated, and firebase won't use them anymore to prevent dangerous errors)

//FIX: make sure collection queries are not returned empty, check if to if length !== 0 before getting ref
