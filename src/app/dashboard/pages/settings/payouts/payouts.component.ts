import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/shared/helper.service';
import Stripe from 'stripe';
import { Payout } from './payout.model';

@Component({
  selector: 'app-payouts',
  templateUrl: './payouts.component.html',
  styleUrls: ['./payouts.component.scss'],
})
export class PayoutsComponent implements OnInit {
  constructor(private helperService: HelperService) {}

  ngOnInit(): void {
    //FUTURE-UPDATE: add loading spinner
    // this.helperService
    //   .getStripeMerchantPayouts()
    //   .then((payouts: Stripe.Payout[]) => {
    //     payouts.map((i) => {
    //       console.log('payouts: ', new Payout(i));
    //     });
    //   });
  }
}
