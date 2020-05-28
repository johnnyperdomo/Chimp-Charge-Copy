//Stripe connect api to manage connect user account payments
import * as functions from 'firebase-functions';
import * as express from 'express';

import * as cors from 'cors';

const app = express();
app.use(cors({ origin: true })); //middleware, applies to every single route in our api; intercepts the request and response

app.get('/connect-auth', (req, res) => {
  const scope = req.query.scope;
  const code = req.query.code;

  const error = req.query.error;
  const error_description = req.query.error_description;

  if (error || error_description) {
    ////TODO:return error, redirect user to app, maybe send a 400 message or just return null
    res.status(400).send(error);
  }

  if (scope && code) {
    //TODO: if success, add to firestore user, and then redirect to app

    res.send(`access granted; scope: ${scope}, code: ${code}`);
  } else {
    res.status(400).send('invalid request');
  }
});

export const api = functions.https.onRequest(app);
