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
          await updateSubscriptionOnFirestoreMembership(
            subscriptionUpdated,
            previousAttributes && previousAttributes.status
          );
        }

        return;
      case 'customer.subscription.deleted':
        const subscriptionDeleted = eventObject as Stripe.Subscription;

        await cancelSubscriptionOnFirestoreMembership(subscriptionDeleted);
        return;

      // LATER: send transactional emails based on successful or past due payments, using the 'invoice' webhooks
      default:
        return;
    }
  } catch (error) {
    throw Error(error);
  }
}
