import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getOrCreateCustomerMerchant } from '../merchant/customers.merchant';
import { sgSendWelcomeEmail } from '../merchant/emails.merchant';
import { welcomeEmailType } from '../shared/extensions';

const auth = admin.auth();

// create a new stripe customer when a new merchant document is created
//TODO: rename this function
export const createStripeCustomerMerchant = functions.firestore
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

      await merchantRef.update({
        customerID: customer.id,
      });

      functions.logger.log('send email triggered from merchants/ should send');

      const emailData: welcomeEmailType = {
        firstName: data.firstName,
        email,
      };

      return await sgSendWelcomeEmail(emailData);

      //TODO: send welcome email!
    } catch (error) {
      throw Error(error);
    }
  });
