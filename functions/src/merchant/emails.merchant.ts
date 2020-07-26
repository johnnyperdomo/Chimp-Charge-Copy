import * as sgMail from '@sendgrid/mail';
import { sendgrid_api_key, app_template_ids } from '../shared/email-config';
import {
  welcomeEmailType,
  trialStartEmailType,
  subscriptionStartEmailType,
  subscriptionCancelEmailType,
} from '../shared/extensions';
import { formitUnitAmount } from '../shared/accounting';
import { formatUnixDate } from '../shared/date-formatter';
import Stripe from 'stripe';

sgMail.setApiKey(sendgrid_api_key);

export async function sgWelcomeEmail(email: string, firstName: string) {
  const data: welcomeEmailType = {
    firstName,
    email,
  };

  const msg = {
    to: data.email,
    from: 'no-reply@chimpcharge.com',
    templateId: app_template_ids.welcome_id,
    dynamic_template_data: {
      first_name: data.firstName,
    },
  };

  try {
    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgTrialStartEmail(
  email: string,
  firstName: string,
  lastName: string,
  subscription: Stripe.Subscription
) {
  const data: trialStartEmailType = {
    firstName,
    lastName,
    email,
    membershipStatus: subscription.status,
    membershipPrice: subscription.items.data[0].price.unit_amount as number,
    membershipBillingInterval: subscription.items.data[0].plan.interval,
    trialStartDate: subscription.trial_start as number,
    trialEndDate: subscription.trial_end as number,
  };

  const msg = {
    to: data.email,
    from: 'no-reply@chimpcharge.com',
    templateId: app_template_ids.trial_start_id,
    dynamic_template_data: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      membership_status: data.membershipStatus,
      membership_price: formitUnitAmount(data.membershipPrice),
      membership_billing_interval: data.membershipBillingInterval,
      trial_start_date: formatUnixDate(data.trialStartDate),
      trial_end_date: formatUnixDate(data.trialEndDate),
    },
  };

  try {
    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionStartEmail(
  email: string,
  firstName: string,
  lastName: string,
  subscription: Stripe.Subscription
) {
  const data: subscriptionStartEmailType = {
    firstName,
    lastName,
    email,
    membershipStatus: subscription.status,
    membershipPrice: subscription.items.data[0].price.unit_amount as number,
    membershipBillingInterval: subscription.items.data[0].plan.interval,
    subscriptionStartDate: subscription.start_date,
  };

  const msg = {
    to: data.email,
    from: 'no-reply@chimpcharge.com',
    templateId: app_template_ids.subscription_start_id,
    dynamic_template_data: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      membership_status: data.membershipStatus,
      membership_price: formitUnitAmount(data.membershipPrice),
      membership_billing_interval: data.membershipBillingInterval,
      subscription_start_date: formatUnixDate(data.subscriptionStartDate),
    },
  };

  try {
    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionCancelEmail(email: string) {
  const data: subscriptionCancelEmailType = {
    email,
  };

  const msg = {
    to: data.email,
    from: 'no-reply@chimpcharge.com',
    templateId: app_template_ids.subscription_cancel_id,
  };

  try {
    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}
