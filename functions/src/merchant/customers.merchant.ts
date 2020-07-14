import { stripe } from '../shared/config';

export async function getOrCreateCustomerMerchant(
  email: string,
  name: string,
  merchantUID: string,
  idempotencyKey: string
) {
  try {
    const findCustomer = await stripe.customers.list({
      email,
    });

    //if customer doesn't exist, create a new one
    if (findCustomer.data.length === 0) {
      const createdCustomer = await stripe.customers.create(
        {
          email,
          name,
          metadata: { chimp_charge_firebase_merchant_uid: merchantUID },
        },
        { idempotencyKey }
      );

      return createdCustomer;
    } else {
      const retrievedCustomer = findCustomer.data[0];
      return retrievedCustomer;
    }
  } catch (err) {
    throw new Error('stripe: getOrCreateCustomer: ' + err);
  }
}
