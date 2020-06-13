import * as functions from 'firebase-functions';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
import { Stripe } from 'stripe';

const db = admin.firestore();

//TODO: add function, when new payment intent webhook is succeeded, add transaction to sub-collection of firestore.paymentlink.transactions { transaction: Stripe.Transaction(successful ones) } to see how many transactions with this payment link. match payment intent with product id => think about saving only the trnxn id for this one, since collection is able to be read outside auth, unless....subcollection of trx can be locked.then (show full transaction detail)
//TODO: ^ or just add aggregation to root level

//cloud functions exports ====================================>

export const onCreatePaymentLink = functions.https.onCall(
  async (data, context) => {
    const productIdempotencyKey: string = data.productIdempotencyKey; //used to prevent duplicates
    const priceIdempotencyKey: string = data.priceIdempotencyKey;
    const productName: string = data.productName;
    let productDesc: string | undefined = data.productDesc; //optional value
    const amount: number = data.amount;

    if (productDesc === '' || null) {
      productDesc = undefined; //need to pass undefined to stripe
    }

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'The function must be called ' + 'while authenticated.'
      );
    }

    try {
      const userId = context.auth?.uid;
      const userRef = db.doc(`merchants/${userId}`);
      const userSnap = await userRef.get();
      const userData = userSnap.data()!;

      const eventIDQuery = await db
        .collection('payment-links')
        .where('eventID', '==', productIdempotencyKey)
        .get();

      if (!(eventIDQuery.docs.length === 0)) {
        //if eventID already exists, function has already been processed
        throw new functions.https.HttpsError(
          'already-exists',
          'This payment link has already been created'
        );
      }

      const merchantUID = userData.uid;
      const stripeConnectID = userData.stripeConnectID;

      if (!stripeConnectID) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'The function must be called with a valid stripe connect id.'
        );
      }

      const product = await createProduct(
        merchantUID,
        stripeConnectID,
        productIdempotencyKey,
        productName,
        productDesc
      );

      const price = await createPrice(
        merchantUID,
        stripeConnectID,
        priceIdempotencyKey,
        amount,
        product.id
      );

      const newDoc = await db.collection('payment-links').add({
        price: price,
        product: product,
        merchantUID: merchantUID,
        connectID: stripeConnectID,
        lastUpdated: admin.firestore.Timestamp.now(),
        eventID: productIdempotencyKey, //check if this event has already been processed
      });

      return newDoc;
    } catch (err) {
      throw new functions.https.HttpsError('unknown', err);
    }
  }
);

//TODO:
// export const onEditPaymentLink = functions.https.onCall(
//   async (data, context) => {}
// );

export const onDeletePaymentLink = functions.https.onCall(
  async (data, context) => {
    const priceID: string = data.priceID;
    const productID: string = data.productID;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'The function must be called ' + 'while authenticated.'
      );
    }

    try {
      const userId = context.auth?.uid;
      const userRef = db.doc(`merchants/${userId}`);
      const userSnap = await userRef.get();
      const userData = userSnap.data()!;

      const stripeConnectID = userData.stripeConnectID;

      if (!stripeConnectID) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'The function must be called ' + 'with a valid stripe connect id.'
        );
      }

      const prodResponse = await archiveProduct(
        priceID,
        productID,
        stripeConnectID
      );

      if (prodResponse.active === false) {
        const query = await db
          .collection('payment-links')
          .where('product.id', '==', prodResponse.id)
          .get();
        const docID = query.docs[0].id;

        const deleteDoc = await db
          .collection('payment-links')
          .doc(docID)
          .delete();

        return deleteDoc;
      } else {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Stripe.Product was not successfully archived, item is still active'
        );
      }
    } catch (err) {
      throw new functions.https.HttpsError('unknown', err);
    }
  }
);

//methods ===============================>

//Products ==========================>
async function createProduct(
  merchantUID: string,
  connectID: string,
  idempotencyKey: string,
  name: string,
  description?: string
) {
  try {
    const product = await stripe.products.create(
      {
        name: name,
        description: description,
        metadata: { firebase_merchant_uid: merchantUID },
      },
      { idempotencyKey: idempotencyKey, stripeAccount: connectID }
    );
    return product;
  } catch (err) {
    throw new Error('stripe: createProduct: ' + err);
  }
}

async function archiveProduct(
  priceID: string,
  productID: string,
  connectID: string
) {
  //set product to inactive, since can't delete product in api
  try {
    await archivePrice(priceID, connectID);

    const response = await stripe.products.update(
      productID,
      { active: false },
      { stripeAccount: connectID }
    );

    return response;
  } catch (err) {
    throw new Error('stripe: updateProduct - archive: ' + err);
  }
}

//TODO: make for recurring payment
async function createPrice(
  merchantUID: string,
  connectID: string,
  idempotencyKey: string,
  amount: number,
  productID: string,
  recurring?: Stripe.Price.Recurring
) {
  //NEXT-UPDATE: might have to change unit_amount calculation if in different currencies

  try {
    const price = await stripe.prices.create(
      {
        unit_amount: amount,
        currency: 'usd', //NEXT-UPDATE: add dynamic currencies?
        product: productID,
        metadata: { firebase_merchant_uid: merchantUID },
      },
      { idempotencyKey: idempotencyKey, stripeAccount: connectID }
    );
    return price;
  } catch (err) {
    throw new Error('stripe: createPrice: ' + err);
  }
}

async function archivePrice(priceID: string, connectID: string) {
  //sets price to inactive
  try {
    const response = await stripe.prices.update(
      priceID,
      {
        active: false,
      },
      {
        stripeAccount: connectID,
      }
    );
    return response;
  } catch (err) {
    throw new Error('stripe: updatePrice - archive: ' + err);
  }
}
