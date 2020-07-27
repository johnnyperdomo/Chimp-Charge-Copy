import * as sgMail from '@sendgrid/mail';
import {
  sendgrid_api_key,
  customer_template_ids,
  merchant_template_ids,
} from '../shared/email-config';
import {
  paymentRefundConnectCustomerEmailType,
  subscriptionPaymentNewConnectCustomerEmailType,
  subscriptionStartConnectCustomerEmailType,
  subscriptionCancelConnectCustomerEmailType,
  subscriptionPastDueConnectCustomerEmailType,
  paymentNewConnectCustomerEmailType,
  paymentRefundConnectMerchantEmailType,
  subscriptionPaymentNewConnectMerchantEmailType,
  subscriptionStartConnectMerchantEmailType,
  subscriptionCancelConnectMerchantEmailType,
  subscriptionPastDueConnectMerchantEmailType,
  paymentNewConnectMerchantEmailType,
} from '../shared/extensions';
import { formatUnitAmount } from '../shared/accounting';
import { formatUnixDate } from '../shared/date-formatter';
import Stripe from 'stripe';

sgMail.setApiKey(sendgrid_api_key);

// customer // =====>
export async function sgPaymentNewConnectCustomerEmail(
  merchantBusinessName: string,
  merchantEmail: string,
  customer: Stripe.Customer,
  productName: string,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const data: paymentNewConnectCustomerEmailType = {
      merchantBusinessName,
      merchantEmail,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      transactionID: paymentIntent.id,
      transactionAmount: paymentIntent.amount,
      transactionDate: paymentIntent.created,
    };

    const msg = {
      to: data.customerEmail,
      from: 'no-reply@chimpcharge.com',
      templateId: customer_template_ids.payment_new_id,
      dynamic_template_data: {
        merchant_business_name: data.merchantBusinessName,
        merchant_email: data.merchantEmail,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        transaction_id: data.transactionID,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgPaymentRefundConnectCustomerEmail(
  merchantBusinessName: string,
  merchantEmail: string,
  customer: Stripe.Customer,
  productName: string,
  charge: Stripe.Charge
) {
  try {
    const data: paymentRefundConnectCustomerEmailType = {
      merchantBusinessName,
      merchantEmail,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      transactionID: charge.payment_intent as string,
      transactionAmount: charge.amount,
      transactionDate: charge.refunds.data[0].created,
    };

    const msg = {
      to: data.customerEmail,
      from: 'no-reply@chimpcharge.com',
      templateId: customer_template_ids.payment_refund_id,
      dynamic_template_data: {
        merchant_business_name: data.merchantBusinessName,
        merchant_email: data.merchantEmail,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        transaction_id: data.transactionID,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionPaymentNewConnectCustomerEmail(
  merchantBusinessName: string,
  merchantEmail: string,
  customer: Stripe.Customer,
  productName: string,
  invoice: Stripe.Invoice
) {
  try {
    const data: subscriptionPaymentNewConnectCustomerEmailType = {
      merchantBusinessName,
      merchantEmail,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      invoiceID: invoice.id,
      invoiceNumber: invoice.number!,
      customerSubscriptionBillingInterval: invoice.lines.data[0].plan!.interval,
      transactionAmount: invoice.lines.data[0].price!.unit_amount!,
      transactionDate: invoice.created,
    };

    const msg = {
      to: data.customerEmail,
      from: 'no-reply@chimpcharge.com',
      templateId: customer_template_ids.subscription_payment_new_id,
      dynamic_template_data: {
        merchant_business_name: data.merchantBusinessName,
        merchant_email: data.merchantEmail,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        invoice_id: data.invoiceID,
        invoice_number: data.invoiceNumber,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionStartConnectCustomerEmail(
  merchantBusinessName: string,
  merchantEmail: string,
  customer: Stripe.Customer,
  productName: string,
  subscription: Stripe.Subscription
) {
  try {
    const data: subscriptionStartConnectCustomerEmailType = {
      merchantBusinessName,
      merchantEmail,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      customerSubscriptionBillingInterval:
        subscription.items.data[0].plan.interval,
      customerSubscriptionAmount: subscription.items.data[0].price.unit_amount!,
      customerSubscriptionStartDate: subscription.created,
    };

    const msg = {
      to: data.customerEmail,
      from: 'no-reply@chimpcharge.com',
      templateId: customer_template_ids.subscription_start_id,
      dynamic_template_data: {
        merchant_business_name: data.merchantBusinessName,
        merchant_email: data.merchantEmail,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        customer_subscription_amount: formatUnitAmount(
          data.customerSubscriptionAmount
        ),
        customer_subscription_start_date: formatUnixDate(
          data.customerSubscriptionStartDate
        ),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionCancelConnectCustomerEmail(
  merchantBusinessName: string,
  merchantEmail: string,
  customer: Stripe.Customer,
  productName: string,
  subscription: Stripe.Subscription
) {
  try {
    const data: subscriptionCancelConnectCustomerEmailType = {
      merchantBusinessName,
      merchantEmail,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      customerSubscriptionBillingInterval:
        subscription.items.data[0].plan.interval,
      customerSubscriptionAmount: subscription.items.data[0].price.unit_amount!,
      customerSubscriptionCancelledDate: subscription.canceled_at!,
    };

    const msg = {
      to: data.customerEmail,
      from: 'no-reply@chimpcharge.com',
      templateId: customer_template_ids.subscription_cancel_id,
      dynamic_template_data: {
        merchant_business_name: data.merchantBusinessName,
        merchant_email: data.merchantEmail,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        customer_subscription_amount: formatUnitAmount(
          data.customerSubscriptionAmount
        ),
        customer_subscription_cancelled_date: formatUnixDate(
          data.customerSubscriptionCancelledDate
        ),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionPastDueConnectCustomerEmail(
  merchantBusinessName: string,
  merchantEmail: string,
  customer: Stripe.Customer,
  productName: string,
  invoice: Stripe.Invoice
) {
  try {
    const data: subscriptionPastDueConnectCustomerEmailType = {
      merchantBusinessName,
      merchantEmail,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      invoiceID: invoice.id,
      invoiceNumber: invoice.number!,
      customerSubscriptionBillingInterval: invoice.lines.data[0].plan!.interval,
      transactionAmount: invoice.lines.data[0].price!.unit_amount!,
      transactionDate: invoice.created,
    };

    const msg = {
      to: data.customerEmail,
      from: 'no-reply@chimpcharge.com',
      templateId: customer_template_ids.subscription_past_due_id,
      dynamic_template_data: {
        merchant_business_name: data.merchantBusinessName,
        merchant_email: data.merchantEmail,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        invoice_id: data.invoiceID,
        invoice_number: data.invoiceNumber,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

// merchant // =====>

export async function sgPaymentNewConnectMerchantEmail(
  firstName: string,
  email: string,
  customer: Stripe.Customer,
  productName: string,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const data: paymentNewConnectMerchantEmailType = {
      firstName,
      email,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      transactionID: paymentIntent.id,
      transactionAmount: paymentIntent.amount,
      transactionDate: paymentIntent.created,
    };

    const msg = {
      to: data.email,
      from: 'no-reply@chimpcharge.com',
      templateId: merchant_template_ids.payment_new_id,
      dynamic_template_data: {
        first_name: data.firstName,
        email: data.email,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        transaction_id: data.transactionID,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgPaymentRefundConnectMerchantEmail(
  firstName: string,
  email: string,
  customer: Stripe.Customer,
  productName: string,
  charge: Stripe.Charge
) {
  try {
    const data: paymentRefundConnectMerchantEmailType = {
      firstName,
      email,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      transactionID: charge.payment_intent as string,
      transactionAmount: charge.amount,
      transactionDate: charge.refunds.data[0].created,
    };

    const msg = {
      to: data.email,
      from: 'no-reply@chimpcharge.com',
      templateId: merchant_template_ids.payment_refund_id,
      dynamic_template_data: {
        first_name: data.firstName,
        email: data.email,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        transaction_id: data.transactionID,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionPaymentNewConnectMerchantEmail(
  firstName: string,
  email: string,
  customer: Stripe.Customer,
  productName: string,
  invoice: Stripe.Invoice
) {
  try {
    const data: subscriptionPaymentNewConnectMerchantEmailType = {
      firstName,
      email,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      invoiceID: invoice.id,
      invoiceNumber: invoice.number!,
      customerSubscriptionBillingInterval: invoice.lines.data[0].plan!.interval,
      transactionAmount: invoice.lines.data[0].price!.unit_amount!,
      transactionDate: invoice.created,
    };

    const msg = {
      to: data.email,
      from: 'no-reply@chimpcharge.com',
      templateId: merchant_template_ids.subscription_payment_new_id,
      dynamic_template_data: {
        first_name: data.firstName,
        email: data.email,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        invoice_id: data.invoiceID,
        invoice_number: data.invoiceNumber,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionStartConnectMerchantEmail(
  firstName: string,
  email: string,
  customer: Stripe.Customer,
  productName: string,
  subscription: Stripe.Subscription
) {
  try {
    const data: subscriptionStartConnectMerchantEmailType = {
      firstName,
      email,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      customerSubscriptionBillingInterval:
        subscription.items.data[0].plan.interval,
      customerSubscriptionAmount: subscription.items.data[0].price.unit_amount!,
      customerSubscriptionStartDate: subscription.created,
    };

    const msg = {
      to: data.email,
      from: 'no-reply@chimpcharge.com',
      templateId: merchant_template_ids.subscription_start_id,
      dynamic_template_data: {
        first_name: data.firstName,
        email: data.email,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        customer_subscription_amount: formatUnitAmount(
          data.customerSubscriptionAmount
        ),
        customer_subscription_start_date: formatUnixDate(
          data.customerSubscriptionStartDate
        ),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionCancelConnectMerchantEmail(
  firstName: string,
  email: string,
  customer: Stripe.Customer,
  productName: string,
  subscription: Stripe.Subscription
) {
  try {
    const data: subscriptionCancelConnectMerchantEmailType = {
      firstName,
      email,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      customerSubscriptionBillingInterval:
        subscription.items.data[0].plan.interval,
      customerSubscriptionAmount: subscription.items.data[0].price.unit_amount!,
      customerSubscriptionCancelledDate: subscription.canceled_at!,
    };

    const msg = {
      to: data.email,
      from: 'no-reply@chimpcharge.com',
      templateId: merchant_template_ids.subscription_cancel_id,
      dynamic_template_data: {
        first_name: data.firstName,
        email: data.email,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        customer_subscription_amount: formatUnitAmount(
          data.customerSubscriptionAmount
        ),
        customer_subscription_cancelled_date: formatUnixDate(
          data.customerSubscriptionCancelledDate
        ),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}

export async function sgSubscriptionPastDueConnectMerchantEmail(
  firstName: string,
  email: string,
  customer: Stripe.Customer,
  productName: string,
  invoice: Stripe.Invoice
) {
  try {
    const data: subscriptionPastDueConnectMerchantEmailType = {
      firstName,
      email,
      productName,
      customerName: customer.name!,
      customerEmail: customer.email!,
      invoiceID: invoice.id,
      invoiceNumber: invoice.number!,
      customerSubscriptionBillingInterval: invoice.lines.data[0].plan!.interval,
      transactionAmount: invoice.lines.data[0].price!.unit_amount!,
      transactionDate: invoice.created,
    };

    const msg = {
      to: data.email,
      from: 'no-reply@chimpcharge.com',
      templateId: merchant_template_ids.subscription_past_due_id,
      dynamic_template_data: {
        first_name: data.firstName,
        email: data.email,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_name: data.productName,
        invoice_id: data.invoiceID,
        invoice_number: data.invoiceNumber,
        customer_subscription_billing_interval:
          data.customerSubscriptionBillingInterval,
        transaction_amount: formatUnitAmount(data.transactionAmount),
        transaction_date: formatUnixDate(data.transactionDate),
      },
    };

    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}
