import Stripe from 'stripe';
import * as MoneyFormatter from 'src/app/shared/accounting';

export class Balance {
  public balance: Stripe.Balance;

  constructor(balance: Stripe.Balance) {
    this.balance = balance;
  }

  // estimated future payouts; subject rolling day cycles
  get pendingAmount() {
    //i.e. $350.00

    //get sum of all pending amounts in array
    const totalPending = this.balance.pending
      .map((arr) => arr.amount)
      .reduce((a, b) => a + b, 0);

    return MoneyFormatter.convertMinorUnitToStandard(totalPending);
  }

  get totalAmount() {
    const total = MoneyFormatter.getSumOfNumbers([this.pendingAmount]);

    return MoneyFormatter.convertMinorUnitToStandard(total);
  }
}
