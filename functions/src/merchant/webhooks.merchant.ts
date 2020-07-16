import Stripe from 'stripe';
import { addSubscriptionOnFirestoreMembership } from './subscriptions.merchant';

export async function handleStripeMerchantWebhooks(event: Stripe.Event) {
  const eventObject = event.data.object;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        const subscriptionCreated = eventObject as Stripe.Subscription;

        await addSubscriptionOnFirestoreMembership(subscriptionCreated);

        return;

      case 'customer.subscription.updated':
        //  const subscriptionUpdated = eventObject as Stripe.Subscription;
        return;

      case 'customer.subscription.deleted':
        //   const subscriptionDeleted = eventObject as Stripe.Subscription;

        return;

      default:
        return;
    }
  } catch (error) {
    throw Error(error);
  }
}
