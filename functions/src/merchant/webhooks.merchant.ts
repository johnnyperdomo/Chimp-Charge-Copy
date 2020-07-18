import Stripe from 'stripe';
import {
  addSubscriptionOnFirestoreMembership,
  updateSubscriptionOnFirestoreMembership,
  cancelSubscriptionOnFirestoreMembership,
} from './subscriptions.merchant';

export async function handleStripeMerchantWebhooks(event: Stripe.Event) {
  const eventObject = event.data.object;
  const previousAttributes = event.data.previous_attributes as any;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        const subscriptionCreated = eventObject as Stripe.Subscription;

        // only add successful subscription

        if (
          !(
            subscriptionCreated.status === 'active' ||
            subscriptionCreated.status === 'trialing'
          )
        ) {
          return;
        }

        await addSubscriptionOnFirestoreMembership(subscriptionCreated);

        // TODO: email

        return;
      case 'customer.subscription.updated':
        const subscriptionUpdated = eventObject as Stripe.Subscription;

        // if previous status was incomplete, but now active, that means it was updated from a '3d auth' payment flow => add new sub
        if (
          previousAttributes &&
          previousAttributes.status === 'incomplete' &&
          subscriptionUpdated.status === 'active'
        ) {
          await addSubscriptionOnFirestoreMembership(subscriptionUpdated);
        } else {
          await updateSubscriptionOnFirestoreMembership(subscriptionUpdated);
        }
        // TODO: email, if new active, or new trialing

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
