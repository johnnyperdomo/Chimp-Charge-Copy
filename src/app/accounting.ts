import * as accounting from 'accounting';

export function convertMinorUnitToStandard(amount: number) {
  const standardPrice = amount / 100; //minor to standard currency, i.e. 2300 / 100 => 23.00
  return accounting.formatMoney(standardPrice); //'usd'
}

export function convertStandardToMinorUnit(amount: number) {
  //stripe needs values in minor currency unit
  const minorPrice = amount * 100; //standard to minor currency, i.e. 23.35 * 100 => 2335
  return accounting.unformat(String(minorPrice)); //'usd'
}
