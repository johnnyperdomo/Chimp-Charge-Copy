import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/shared/helper.service';
import Stripe from 'stripe';
import { Payout } from '../payout.model';

@Component({
  selector: 'app-payout-list',
  templateUrl: './payout-list.component.html',
  styleUrls: ['./payout-list.component.scss'],
})
export class PayoutsListComponent implements OnInit {
  payouts: Payout[] = [];

  constructor(private helperService: HelperService) {}

  ngOnInit(): void {
    //FUTURE-UPDATE: add loading spinner
    this.getPayouts();
  }

  async getPayouts() {
    try {
      const retrievedPayouts = await this.helperService.getStripePayouts();

      this.payouts = (retrievedPayouts as Stripe.Payout[]).map((payout) => {
        return new Payout(payout);
      });

      return;
    } catch (error) {
      alert('Unknown error, please try reloading page.' + error);
    }
  }

  onViewPayoutInStripe(payoutID: string) {
    const stripePayoutURL = 'https://dashboard.stripe.com/payouts/' + payoutID; //note: add 'test' url path in test mode

    window.open(stripePayoutURL);
  }
}
