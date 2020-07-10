import * as functions from 'firebase-functions';
import * as request from 'request';

//pub sub to trigger 'chimpApi' cloud function every minute, to eliminate cold start time
export const warmApiRunner = functions.pubsub
  .schedule('* * * * *')
  .onRun(() => {
    request(
      'https://us-central1-chimp-charge-developer.cloudfunctions.net/chimpApi/awake'
    );
  });
