import * as functions from 'firebase-functions';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
import { Stripe } from 'stripe';

const db = admin.firestore();

//cloud functions exports ====================================>
// export const getPaymentLinks = functions.https.onCall(async (data, context) => {
//   //TODO: when getting list of prices, filter to make sure you only retrieve ones that exist on firebase too, which means they created from client
//   //Maybe from metadata
// });

export const onCreatePaymentLink = functions.https.onCall(
  async (data, context) => {
    const productIdempotencyKey: string = data.productIdempotencyKey; //used to prevent duplicates
    const priceIdempotencyKey: string = data.priceIdempotencyKey;
    const productName: string = data.productName;
    const productDesc: string = data.productDesc;
    const amount: number = data.amount;

    console.log('product description in server is: ' + productDesc);

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

      const merchantUID = userData.uid;
      const stripeConnectID = userData.stripeConnectID;

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
        stripePriceID: price.id,
        stripeProductID: product.id,
        merchantUID: merchantUID,
        lastUpdated: admin.firestore.Timestamp.now(),
      });

      const linkObject = {
        product: product,
        price: price,
        document: newDoc,
      };

      return linkObject;
    } catch (err) {
      throw new functions.https.HttpsError('unknown', err);
    }
  }
);

// export const onEditPaymentLink = functions.https.onCall(
//   async (data, context) => {}
// );

// export const onDeletePaymentLink = functions.https.onCall(
//   async (data, context) => {}
// );

//methods ===============================>
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
    console.log('returned product: ' + product);
    return product;
  } catch (err) {
    throw new Error('stripe: createProduct: ' + err);
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
        currency: 'usd', //NEXT-UPDATE: add dynamic currencies
        product: productID,
        metadata: { firebase_merchant_uid: merchantUID },
      },
      { idempotencyKey: idempotencyKey, stripeAccount: connectID }
    );
    console.log('returned price: ' + price);

    return price;
  } catch (err) {
    throw new Error('stripe: createPrice: ' + err);
  }
}
