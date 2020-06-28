import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import * as paymentLinks from './payment-links.connect';
import * as connectAuth from './auth.connect';
import * as admin from 'firebase-admin';
import { stripeClientID, stripe, stripeWebhookSecret } from '../config';
import * as qs from 'querystring';
import { createPaymentIntent } from './onetime-payments.connect';
import { createSubscription } from './subscriptions.connect';
import { handleStripeConnectWebhooks } from './webhooks.connect';

const app = express();

//Helpers ==============================>
app.use(cors({ origin: true })); //cors => any other url can access this api
const authenticate = async (tokenId: string) => {
  return admin
    .auth()
    .verifyIdToken(tokenId)
    .then((decoded) => {
      return decoded;
    })
    .catch((err) => {
      console.error(err);
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You are not authorized to make this request.'
      );
    });
};

app.use(
  express.json({
    verify: (req: any, res, buffer) => (req['rawBody'] = buffer),
  })
);

//Stripe Connect Authentication ==============================>

app.get(
  '/connect/stripeOAuthURL',
  async (req: express.Request, res: express.Response) => {
    if (!req.headers.authorization) {
      res
        .status(403)
        .json({ error: 'You must be logged in to make this request.' });
    }

    const tokenId = req.headers.authorization!.split('Bearer ')[1];

    try {
      await authenticate(tokenId);

      const base = 'https://connect.stripe.com/oauth/authorize?';
      const queryParams = {
        client_id: stripeClientID,
        response_type: 'code',
        scope: 'read_write',
      };
      const endpoint = base + qs.stringify(queryParams);

      res.send({ stripeURL: endpoint });
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

app.post(
  '/connect/connectStandardIntegration',
  async (req: express.Request, res: express.Response) => {
    if (!req.headers.authorization) {
      res
        .status(403)
        .json({ error: 'You must be logged in to make this request.' });
    }

    const tokenId = req.headers.authorization!.split('Bearer ')[1];

    try {
      const authenticated = await authenticate(tokenId);

      const response = await connectAuth.connectStandardIntegration(
        req.body,
        authenticated.uid
      );
      res.send({ authorization: response, userID: authenticated.uid });
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

//Payment Links ==============================>
app.post(
  '/connect/onCreatePaymentLink',
  async (req: express.Request, res: express.Response) => {
    if (!req.headers.authorization) {
      res
        .status(403)
        .json({ error: 'You must be logged in to make this request.' });
    }

    const tokenId = req.headers.authorization!.split('Bearer ')[1];

    try {
      const authenticated = await authenticate(tokenId);

      const response = await paymentLinks.onCreatePaymentLink(
        req.body,
        authenticated.uid
      );
      res.send(response);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

app.patch(
  '/connect/onEditPaymentLink',
  async (req: express.Request, res: express.Response) => {
    if (!req.headers.authorization) {
      res
        .status(403)
        .json({ error: 'You must be logged in to make this request.' });
    }

    const tokenId = req.headers.authorization!.split('Bearer ')[1];

    try {
      const authenticated = await authenticate(tokenId);

      const response = await paymentLinks.onEditPaymentLink(
        req.body,
        authenticated.uid
      );
      res.send(response);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

app.patch(
  '/connect/onDeletePaymentLink',
  async (req: express.Request, res: express.Response) => {
    if (!req.headers.authorization) {
      res
        .status(403)
        .json({ error: 'You must be logged in to make this request.' });
    }

    const tokenId = req.headers.authorization!.split('Bearer ')[1];

    try {
      const authenticated = await authenticate(tokenId);

      const response = await paymentLinks.onDeletePaymentLink(
        req.body,
        authenticated.uid
      );
      res.send(response);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

//Checkout ==============================>
//non-authenticated customers

app.post(
  '/connect/createPaymentIntent',
  async (req: express.Request, res: express.Response) => {
    try {
      const paymentIntent = await createPaymentIntent(req.body);

      res.send(paymentIntent);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

app.post(
  '/connect/createSubscription',
  async (req: express.Request, res: express.Response) => {
    try {
      const subscription = await createSubscription(req.body);

      res.send(subscription);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

//Webhooks ==================>
app.post('/connect/stripeWebhooks', async (req: any, res: express.Response) => {
  if (!req.headers['stripe-signature']) {
    return;
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    //  const subscription = await createSubscription(req.body);
    event = stripe.webhooks.constructEvent(
      req['rawBody'],
      signature,
      stripeWebhookSecret
    );

    res.send({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!event) {
    return;
  }

  try {
    await handleStripeConnectWebhooks(event);
    return;
  } catch (err) {
    throw new functions.https.HttpsError('unknown', err);
  }
});

export const chimpApi = functions.https.onRequest(app);
