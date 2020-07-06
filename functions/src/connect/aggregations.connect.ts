// import * as admin from 'firebase-admin';
// import * as functions from 'firebase-functions';

// const db = admin.firestore();
//these functions are used to map grouped data for faster/cheaper querying when fetching items from database

//TODO: Batch firestore writes
export async function aggregatePaymentIntent(connectID: string) {
  //TODO: set timeout to 180 seconds
  //aggregations.transactions(up/down)
  //customers.transactions(up/down)
  //payment-links.transactions(up/down)
}
