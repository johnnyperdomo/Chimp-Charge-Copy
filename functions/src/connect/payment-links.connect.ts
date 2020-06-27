import * as functions from 'firebase-functions';
import { stripe } from '../config';
import * as admin from 'firebase-admin';
import { Stripe } from 'stripe';

const db = admin.firestore();

//TODO: add function, when new payment intent webhook is succeeded, add transaction to sub-collection of firestore.paymentlink.transactions { transaction: Stripe.Transaction(successful ones) } to see how many transactions with this payment link. match payment intent with product id => think about saving only the trnxn id for this one, since collection is able to be read outside auth, unless....subcollection of trx can be locked.then (show full transaction detail)
//TODO: ^ or just add aggregation to root level

//cloud functions exports ====================================>

export async function onCreatePaymentLink(data: any, userID: string) {
  const productIdempotencyKey: string = data.productIdempotencyKey; //used to prevent duplicates
  const priceIdempotencyKey: string = data.priceIdempotencyKey;
  const productName: string = data.productName;
  let productDesc: string | undefined = data.productDesc; //optional
  let interval: string | undefined = data.interval; //optional
  const amount: number = data.amount;

  if (productDesc === '' || null) {
    productDesc = undefined; //need to pass undefined to stripe
  }

  if (interval === '' || null) {
    interval = undefined; //need to pass undefined to stripe
  }

  try {
    const userId = userID;
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

    const merchantUID = userData.merchantUID;
    const stripeConnectID = userData.connectID;

    if (!merchantUID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Merchant ID not found'
      );
    }

    if (!stripeConnectID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Stripe Connect ID not found'
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
      product.id,
      interval
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

/////////////
export async function onEditPaymentLink(data: any, userID: string) {
  const paymentLinkID: string = data.paymentLinkID;
  const productName: string = data.productName;
  let productDesc: string = data.productDesc; //optional

  if (productDesc === '' || null) {
    productDesc = ''; //passing in 'undefined' to edit doesn't cause change
  }

  try {
    const userId = userID;
    const userRef = db.doc(`merchants/${userId}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data()!;

    const merchantUID = userData.merchantUID;
    const stripeConnectID = userData.connectID;

    if (!merchantUID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Merchant ID not found'
      );
    }

    if (!stripeConnectID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Stripe Connect ID not found'
      );
    }

    const paymentLinkRef = db.doc(`payment-links/${paymentLinkID}`);
    const paymentLinkData = (await paymentLinkRef.get()).data()!;

    const productID = paymentLinkData.product.id;

    const updateProduct = await editProduct(
      productID,
      stripeConnectID,
      productName,
      productDesc
    );

    const updatePaymentLinkDoc = paymentLinkRef.update({
      product: updateProduct,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    return updatePaymentLinkDoc;
  } catch (err) {
    console.error(err); //TODO: add console.log errors to all throw error methods to log it in the console
    throw new functions.https.HttpsError('unknown', err);
  }
}

export async function onDeletePaymentLink(data: any, userID: string) {
  const priceID: string = data.priceID;
  const productID: string = data.productID;

  try {
    const userId = userID;
    const userRef = db.doc(`merchants/${userId}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data()!;

    const stripeConnectID = userData.connectID;

    if (!stripeConnectID) {
      throw new functions.https.HttpsError(
        'not-found',
        'Stripe Connect ID not found'
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
    console.error(err);
    throw new functions.https.HttpsError('unknown', err);
  }
}

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
        metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
      },
      { idempotencyKey: idempotencyKey, stripeAccount: connectID }
    );
    return product;
  } catch (err) {
    throw new Error('stripe: createProduct: ' + err);
  }
}

async function editProduct(
  productID: string,
  connectID: string,
  name: string,
  description: string
) {
  try {
    const response = await stripe.products.update(
      productID,
      {
        name: name,
        description: description,
      },
      { stripeAccount: connectID }
    );

    return response;
  } catch (err) {
    throw new Error('stripe: updateProduct: ' + err);
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

//Price ==========================>

async function createPrice(
  merchantUID: string,
  connectID: string,
  idempotencyKey: string,
  amount: number,
  productID: string,
  recurringInterval?: string
) {
  //FUTURE-UPDATE: might have to change unit_amount calculation if in different currencies

  //FUTURE-UPDATE: make function better, this is ugly code
  try {
    if (recurringInterval) {
      const price = await stripe.prices.create(
        {
          unit_amount: amount,
          currency: 'usd', //FUTURE-UPDATE: add dynamic currencies?
          product: productID,
          recurring: {
            interval: getStripeIntervalFromString(recurringInterval),
          },
          metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
        },
        { idempotencyKey: idempotencyKey, stripeAccount: connectID }
      );
      return price;
    } else {
      const price = await stripe.prices.create(
        {
          unit_amount: amount,
          currency: 'usd', //FUTURE-UPDATE: add dynamic currencies?
          product: productID,
          metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
        },
        { idempotencyKey: idempotencyKey, stripeAccount: connectID }
      );
      return price;
    }
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

function getStripeIntervalFromString(
  interval: string
): Stripe.Price.Recurring.Interval {
  switch (interval) {
    case 'day':
      return 'day';

    case 'month':
      return 'month';

    case 'week':
      return 'week';

    case 'year':
      return 'year';

    default:
      return 'month';
  }
}
