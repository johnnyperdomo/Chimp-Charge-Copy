import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChimpApiService {
  private chimpApiUrl = environment.chimpApiURL;

  constructor(private http: HttpClient, private auth: AngularFireAuth) {}

  //post: creating a new resource
  async post(pathUrl: string, httpBody: any, requiresAuth: boolean = true) {
    try {
      const headers = requiresAuth ? await this.getAuthHeaders() : null;

      const serverData = await this.http
        .post(this.chimpApiUrl + pathUrl, httpBody, {
          headers: headers,
        })
        .toPromise();

      return serverData;
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        throw Error(err.error.message);
      }

      //FUTURE-UPDATE: make sure error messages work for other functions
      throw Error(err);
    }
  }

  //patch, delete: updating an existing resource
  async patch(pathUrl: string, httpBody: any, requiresAuth: boolean = true) {
    try {
      const headers = requiresAuth ? await this.getAuthHeaders() : null;

      const serverData = await this.http
        .patch(this.chimpApiUrl + pathUrl, httpBody, {
          headers: headers,
        })
        .toPromise();

      return serverData;
    } catch (err) {
      throw Error(err);
    }
  }

  //get: get existing resource
  async get(pathUrl: string, requiresAuth: boolean = true) {
    try {
      const headers = requiresAuth ? await this.getAuthHeaders() : null;

      const serverData = await this.http
        .get(this.chimpApiUrl + pathUrl, {
          headers: headers,
        })
        .toPromise();

      return serverData;
    } catch (err) {
      throw Error(err);
    }
  }

  private async getAuthHeaders() {
    try {
      const tokenId = (await (await this.auth.currentUser).getIdTokenResult())
        .token;

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenId}`,
      });

      return headers;
    } catch (err) {
      throw Error(err);
    }
  }
}
