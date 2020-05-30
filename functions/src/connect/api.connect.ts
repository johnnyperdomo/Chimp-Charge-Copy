//Stripe connect api to manage connect user account payments
import * as functions from 'firebase-functions';
import * as express from 'express';

import * as cors from 'cors';

const app = express();
app.use(cors({ origin: true })); //middleware, applies to every single route in our api; intercepts the request and response

//app.get(/some-url)

export const api = functions.https.onRequest(app);
