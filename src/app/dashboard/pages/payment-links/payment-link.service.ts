import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PaymentLinkService {
  constructor() {}

  copyPayLink(id: string) {
    const currentURL = location.origin;
    const payURL = currentURL + `/pay/${id}`;

    return payURL;
  }
}
