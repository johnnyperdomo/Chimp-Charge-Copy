import Stripe from 'stripe';
import * as MoneyFormatter from 'src/app/shared/accounting';
import * as moment from 'moment';

export class Payout {
  public payout: Stripe.Payout;

  constructor(payout: Stripe.Payout) {
    this.payout = payout;
  }

  get arrivalDate() {
    //payout.arrivalDate => Date()
    const arrival = this.payout.arrival_date; //unix epoch
    const formattedDate = moment.unix(arrival).format('MMMM Do, YYYY');
    return formattedDate;
  }

  get payoutAmount() {
    //i.e. $350.00
    return MoneyFormatter.convertMinorUnitToStandard(this.payout.amount);
  }

  get destinationName() {
    //identifier name of bank or card : based on type

    //type 'bank-account'
    if (this.payout.type === 'bank_account') {
      return (this.payout.destination as Stripe.BankAccount).bank_name;
    }

    //else: 'type card'
    return (this.payout.destination as Stripe.Card).brand;
  }

  get destinationLast4() {
    //identifier name of bank or card : based on type

    //type 'bank-account'
    if (this.payout.type === 'bank_account') {
      return (this.payout.destination as Stripe.BankAccount).last4;
    }

    //else: 'type card'
    return (this.payout.destination as Stripe.Card).last4;
  }
}
