import * as currency from 'currency.js';

export function formitUnitAmount(amount: number) {
  return currency(amount).divide(100).value;
}
