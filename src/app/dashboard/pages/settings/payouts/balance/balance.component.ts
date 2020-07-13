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

  async getBalance() {
    try {
      const retrievedBalance = await this.helperService.getStripeBalance();

      this.balance = new Balance(retrievedBalance as Stripe.Balance);

      return;
    } catch (error) {
      alert('Unknown error, please try reloading page.' + error);
    }
  }
}
