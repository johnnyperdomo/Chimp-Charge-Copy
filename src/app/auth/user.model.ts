export class User {
  constructor(
    public email: string,
    public id: string,
    private _token: string,
    private _tokenExpirationDate: Date
  ) {}

  //check validity when getting token

  get token() {
    //if tok..Date doesn't exist,or if the timestamp is smaller than the current timestamp (expired)
    if (!this._tokenExpirationDate || new Date() > this._tokenExpirationDate) {
      //don't return the token if it's expired
      return null;
    }
    return this._token;
  }
}
