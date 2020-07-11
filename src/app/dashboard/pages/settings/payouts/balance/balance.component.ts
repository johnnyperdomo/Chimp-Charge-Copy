import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/shared/helper.service';
import Stripe from 'stripe';
import { Balance } from './balance.model';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss'],
})
export class BalanceComponent implements OnInit {
  balance: Balance;

  constructor(private helperService: HelperService) {}

  ngOnInit(): void {
    //FUTURE-UPDATE: add loading spinner

    this.getBalance();
  }

  getBalance() {
    this.helperService
      .getStripeMerchantBalance()
      .then((balance: Stripe.Balance) => {
        this.balance = new Balance(balance);
        console.log('balance: ', balance);
      });
  }
}
