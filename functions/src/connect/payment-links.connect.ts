import * as functions from 'firebase-functions';

export const getPaymentLinks = functions.https.onCall(async (data, context) => {
  //TODO: when getting list of prices, filter to make sure you only retrieve ones that exist on firebase too, which means they created from client
  //Maybe from metadata
});

export const onCreatePaymentLink = functions.https.onCall(
  async (data, context) => {
    const idempotency_key = data.idempotency_key; //used to prevent duplicates
  }
);

export const onEditPaymentLink = functions.https.onCall(
  async (data, context) => {}
);

export const onEditPaymentLinke = functions.firestore
  .document('/het')
  .onCreate((snap, context) => {
    context.eventId;
  });

export const onDeletePaymentLink = functions.https.onCall(
  async (data, context) => {}
);
