export class User {
  constructor(
    public email: string,
    public id: string,
    public _token: string,
    public _expirationTime: string
  ) {}
  //TODO: figure out what to do with the token
}
