import * as admin from 'firebase-admin';

admin.initializeApp();

export { chimpApi } from './api';

//FUTURE-UPDATE: when retrieving items, auto pagination to get all list items - autoPagingToArray - https://github.com/stripe/stripe-node
//FUTURE-UPDATE: add stricter static typing, especially when it has to do with callable functions, with return 'data: any'. Overall code in general

//FUTURE-UPDATE: better server logging, error handling, error messages for client side, status codes

//FUTURE-UPDATE: only propagate temporary errors, like server errors, service downtown, or network errors. i.e., 'could not validate stripe webhook' should not be an error that we log in firebase,, but 'could not save data to firebase' could be a potential error we may want to pay attention to. we also don't have to log every error in firebase error console,(functions.https), only necessary ones that require our attention. so although an insufficient card does throw an error, just present it to user, but this is not an error that requires our attention[not a bug on server side, not our problem]
