import Stripe from 'stripe';
import {
  addSubscriptionOnFirestoreMembership,
  updateSubscriptionOnFirestoreMembership,
  cancelSubscriptionOnFirestoreMembership,
} from './subscriptions.merchant';

export async function handleStripeMerchantWebhooks(event: Stripe.Event) {
  const eventObject = event.data.object;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        const subscriptionCreated = eventObject as Stripe.Subscription;

        await addSubscriptionOnFirestoreMembership(subscriptionCreated);

        // TODO: email

        return;
      case 'customer.subscription.updated':
        const subscriptionUpdated = eventObject as Stripe.Subscription;

        // TODO: email, if new active, or new trialing
        await updateSubscriptionOnFirestoreMembership(subscriptionUpdated);
        return;
      case 'customer.subscription.deleted':
        const subscriptionDeleted = eventObject as Stripe.Subscription;

        await cancelSubscriptionOnFirestoreMembership(subscriptionDeleted);
        // TODO: email

        return;
      default:
        return;
    }
  } catch (error) {
    throw Error(error);
  }
}
