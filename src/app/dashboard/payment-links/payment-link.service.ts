import { Injectable } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { environment } from 'src/environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';

@Injectable({
  providedIn: 'root',
})
export class PaymentLinkService {
  constructor(
    private location: PlatformLocation,
    private clipboard: Clipboard
  ) {}

  async copyPayLink(id: string) {
    const scheme = 'https://';
    const hostName = this.location.hostname;
    const path = `/pay/${id}`;

    //TODO: check to see if this works after building and deploying project: for production
    if (!environment.production) {
      //DEV Mode: local host:port
      const port = this.location.port;
      const devURL = `${hostName}:${port}${path}`;

      this.clipboard.copy(devURL);
    } else {
      //Production mode
      const payURL = `${scheme}${hostName}${path}`;

      this.clipboard.copy(payURL);
    }
  }
}
