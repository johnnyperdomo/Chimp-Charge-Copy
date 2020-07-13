import { stripe } from '../shared/config';

//to handle subscription billing for merchant with stripe
export async function onCreateBillingPortalSession() {
  //TODO: get customerID from firestore merchant doc.

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: 'cus_HciZqem399OMvr',
    });

    return portalSession;
  } catch (error) {
    throw error;
  }
}
