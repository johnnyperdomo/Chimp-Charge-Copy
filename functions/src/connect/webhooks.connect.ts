import Stripe from 'stripe';

export async function handleStripeWebhooks(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!', paymentIntent);
        return;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('PaymentMethod was attached to a Customer!', paymentMethod);
        return;
      default:
        return;
    }
  } catch (err) {
    throw new Error(err);
  }
}
