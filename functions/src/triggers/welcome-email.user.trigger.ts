// import * as functions from 'firebase-functions';
// import { sgSendWelcomeEmail } from '../merchant/emails.merchant';
// import * as admin from 'firebase-admin';
// import { welcomeEmailType } from '../shared/extensions';

// const auth = admin.auth();

// export const sendWelcomeEmail = functions.firestore
//   .document('merchants/{merchantUID}')
//   .onCreate(async (snapshot, context) => {
//     const data = snapshot.data();

//     try {
//       const merchantUID = data.merchantUID;
//       const email = (await auth.getUser(merchantUID)).email!;

//       const emailData: welcomeEmailType = {
//         firstName: data.firstName,
//         email,
//       };

//       functions.logger.log('send email triggered from merchants/ should send');

//       return await sgSendWelcomeEmail(emailData);
//     } catch (error) {
//       throw Error(error);
//     }
//   });
