import { AbstractControl } from '@angular/forms';
import * as accounting from 'src/app/shared/accounting';

export class PriceValidation {
  static ConfirmPriceRange(AC: AbstractControl) {
    const amountControl = AC.get('amount');

    const minorUnit = accounting.convertStandardToMinorUnit(
      amountControl.value
    );

    if (minorUnit < 50 || minorUnit > 99999999) {
      //$0.50 - $999,999.99 usd

      amountControl.setErrors({ PriceOutOfRange: true });
    } else {
      if (amountControl.hasError('PriceOutOfRange')) {
        amountControl.setErrors({ PriceOutOfRange: null });
        amountControl.updateValueAndValidity();
      }
      return null;
    }
  }
}
