import * as currency from 'currency.js';

export function formatUnitAmount(amount: number) {
  return currency(amount).divide(100).value;
}
