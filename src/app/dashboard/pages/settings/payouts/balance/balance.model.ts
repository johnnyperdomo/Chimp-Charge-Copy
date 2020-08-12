import Stripe from 'stripe';
import * as MoneyFormatter from 'src/app/shared/accounting';

export class Balance {
  public balance: Stripe.Balance;

  constructor(balance: Stripe.Balance) {
    this.balance = balance;
  }

  // on the way to bank
  get availableAmount() {
    //i.e. $350.00

    //get sum of all available amounts in array
    const totalAvailable = this.balance.available
      .map((arr) => arr.amount)
      .reduce((a, b) => a + b, 0);

    return MoneyFormatter.convertMinorUnitToStandard(totalAvailable);
  }

  // estimated future payouts; rolling day cycles
  get pendingAmount() {
    //i.e. $350.00

    //get sum of all pending amounts in array
    const totalPending = this.balance.pending
      .map((arr) => arr.amount)
      .reduce((a, b) => a + b, 0);

    return MoneyFormatter.convertMinorUnitToStandard(totalPending);
  }

  get totalAmount() {
    const total = MoneyFormatter.getSumOfNumbers([
      this.availableAmount,
      this.pendingAmount,
    ]);

    return MoneyFormatter.convertMinorUnitToStandard(total);
  }
}
