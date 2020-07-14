import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getOrCreateCustomerMerchant } from './merchant/customers.merchant';

const auth = admin.auth();

//when new merchant is created
export const createMerchant = functions.firestore
  .document('merchants/{merchantUID}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const merchantRef = snapshot.ref;

    try {
      const merchantUID = data.merchantUID;
      const email = (await auth.getUser(merchantUID)).email!;
      const name = `${data.firstName} ${data.lastName}`;

      const customer = await getOrCreateCustomerMerchant(
        email,
        name,
        merchantUID,
        context.eventId
      );

      return merchantRef.update({
        customerID: customer.id,
      });
    } catch (error) {
      throw Error(error);
    }
  });
