import * as functions from 'firebase-functions';
const config = functions.config();

//Sendgrid ==================>

export const sendgrid_api_key = config.sendgrid.key;

// Templates // ================>
const templates = config.sendgrid.templates;

// App account templates
const app_templates = templates.app;

export const app_template_ids = {
  welcome_id: app_templates.welcome_id,
  trial_start_id: app_templates.trial_start_id,
  subscription_start_id: app_templates.subscription_start_id,
  subscription_cancel_id: app_templates.subscription_cancel_id,
} as const;

// Connect //

// Customer templates
const customer_templates = templates.connect.customer;

export const customer_template_ids = {
  payment_new_id: customer_templates.payment_new_id,
  payment_refund_id: customer_templates.payment_refund_id,
  subscription_payment_new_id: customer_templates.subscription_payment_new_id,
  subscription_start_id: customer_templates.subscription_start_id,
  subscription_cancel_id: customer_templates.subscription_cancel_id,
  subscription_past_due_id: customer_templates.subscription_past_due_id,
} as const;

// Merchant templates
const merchant_templates = templates.connect.merchant;

export const merchant_template_ids = {
  payment_new_id: merchant_templates.payment_new_id,
  payment_refund_id: merchant_templates.payment_refund_id,
  subscription_payment_new_id: merchant_templates.subscription_payment_new_id,
  subscription_start_id: merchant_templates.subscription_start_id,
  subscription_cancel_id: merchant_templates.subscription_cancel_id,
  subscription_past_due_id: merchant_templates.subscription_past_due_id,
} as const;
