import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChimpApiService {
  private chimpApiUrl = environment.chimpApiURL;

  constructor(private http: HttpClient, private auth: AngularFireAuth) {}

  async post(pathUrl: string, httpBody: any) {
    try {
      const tokenId = (await (await this.auth.currentUser).getIdTokenResult())
        .token;

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenId}`,
      });

      const serverData = await this.http
        .post(this.chimpApiUrl + pathUrl, httpBody, {
          headers: headers,
        })
        .toPromise();

      return serverData;
    } catch (err) {
      throw Error(err);
    }
  }
}
