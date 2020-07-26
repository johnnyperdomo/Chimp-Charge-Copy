import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getOrCreateCustomerMerchant } from '../merchant/customers.merchant';
import { sgWelcomeEmail } from '../merchant/emails.merchant';

const auth = admin.auth();

// create a new stripe customer & send welcome email when a new merchant document is created
export const merchantCreated = functions.firestore
  .document('merchants/{merchantUID}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const merchantRef = snapshot.ref;

    try {
      const merchantUID = data.merchantUID;
      const businessName = data.businessName;
      const email = (await auth.getUser(merchantUID)).email!;
      const name = `${data.firstName} ${data.lastName}`;

      const customer = await getOrCreateCustomerMerchant(
        email,
        name,
        businessName,
        merchantUID,
        context.eventId
      );

      // update merchant ref
      await merchantRef.update({
        customerID: customer.id,
      });

      // send welcome email
      return await sgWelcomeEmail(email, data.firstName);
    } catch (error) {
      throw Error(error);
    }
  });
