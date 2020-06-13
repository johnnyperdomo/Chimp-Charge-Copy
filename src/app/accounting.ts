import * as accounting from 'accounting'; //for formatting; 10 => $10.00
import * as currency from 'currency.js'; //for complex math; eliminate floating point bugs

//Configured to handle 'USD'

export function convertMinorUnitToStandard(amount: number) {
  //minor to standard currency, i.e. 2300 / 100 => $23.00

  const standardPrice = currency(amount).divide(100).format(); //handles floating point issues with math
  return accounting.formatMoney(standardPrice); //234.76 => $234.76
}

export function convertStandardToMinorUnit(amount: number) {
  //standard to minor currency, i.e. 23.35 * 100 => 2335

  const minorPrice = currency(amount).multiply(100).format(); //stripe needs values in minor currency unit
  return accounting.unformat(minorPrice); //1,234 => 1234
}
