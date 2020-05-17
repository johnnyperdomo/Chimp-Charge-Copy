import * as moment from 'moment';

export class User {
  constructor(
    public email: string,
    public id: string,
    public _token: string,
    public _expirationDate: string
  ) {}

  get expiresInMilliseconds() {
    const now = moment();
    const futureExpDate = moment(this._expirationDate);

    return futureExpDate.diff(now, 'milliseconds'); //returns time difference in milliseconds
  }

  get isTokenValid() {
    const now = moment();
    const futureExpDate = moment(this._expirationDate);

    //if token date doesn't exist, or timestamp is expired
    if (!futureExpDate || now > futureExpDate) {
      //don't return token if it's expired
      return null;
    }
    return this._token;
  }
}
