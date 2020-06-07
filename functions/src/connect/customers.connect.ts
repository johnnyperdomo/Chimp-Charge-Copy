//import * as functions from 'firebase-functions';

// export const getCustomers = functions.https.onCall(async (data, context) => {});

//TODO: add function, when new payment intent webhook is succeeded, add transaction to sub-collection of firestore.customer.transactions { transaction: Stripe.Transaction(successful ones) }

//TODO: eliminate customer duplication, when customer checks out, check database to see if there is an email with that customer, if there is no email, create a new one, if there is an email, use the current customer to not create a new one. 1. johnny@gmail.com + 2. johnny@gmail.com == one same person; Make sure your integration keeps a 1 to 1 mapping of user in your database to customer in Stripe.
