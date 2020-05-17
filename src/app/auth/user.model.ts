import * as moment from 'moment';

export class User {
  constructor(
    public email: string,
    public id: string,
    public _token: string,
    public _expirationDate: string
  ) {}
  //TODO: figure out what to do with the token

  get expiresInMilliSeconds() {
    const now = moment();
    const futureExpDate = moment(this._expirationDate);

    return futureExpDate.diff(now, 'milliseconds'); //returns time difference in milliseconds
  }
}
