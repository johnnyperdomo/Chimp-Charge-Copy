import * as sgMail from '@sendgrid/mail';
import { sendgrid_api_key, app_template_ids } from '../shared/email-config';
import { welcomeEmailType } from '../shared/extensions';
import * as functions from 'firebase-functions';

sgMail.setApiKey(sendgrid_api_key);

export async function sgSendWelcomeEmail(data: welcomeEmailType) {
  const msg = {
    to: data.email,
    from: 'no-reply@chimpcharge.com',
    templateId: app_template_ids.welcome_id,
    dynamic_template_data: {
      first_name: data.firstName,
    },
  };

  functions.logger.log('sendgrid function triggered inside');

  try {
    return await sgMail.send(msg);
  } catch (error) {
    throw Error(error);
  }
}
