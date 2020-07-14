import * as functions from 'firebase-functions';

export const sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  // LATER: - generate custom email , for verification. Can generate verify email link(firebase email link) in server. Then use sendgrid with template.

  // TODO: send welcome email with sendgrid
  functions.logger.log(
    `Send welcome email to be triggered here to user: ${user}`
  );
});
