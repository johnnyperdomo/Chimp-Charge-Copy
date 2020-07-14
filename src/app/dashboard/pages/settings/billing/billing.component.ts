import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/shared/helper.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
})
export class BillingComponent implements OnInit {
  constructor(private helperService: HelperService) {}

  ngOnInit(): void {}

  async onCreateBillingPortalSession() {
    //LATER: add loading spinner and disable button when clicked to prevent spamming.
    //LATER: instead of having billing portal, just have all the billing info on this page.
    try {
      const portalSession: any = await this.helperService.createBillingPortalSession();
      const portalURL = portalSession.url;

      window.open(portalURL);

      return portalSession;
    } catch (err) {
      alert(
        'Problem connecting to stripe, please try again. Error: ' + err.error
      );
    }
  }
}

//LATER: if user every cancels, you can always send an email saying that they can always renew their sub before it expires if they change their mind, or add an in-app notification
