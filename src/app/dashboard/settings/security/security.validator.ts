import { AbstractControl } from '@angular/forms';
export class PasswordValidation {
  static MatchPassword(AC: AbstractControl) {
    const newPWControl = AC.get('newPassword');
    const confirmPWControl = AC.get('confirmPassword');

    if (newPWControl.value != confirmPWControl.value) {
      console.log('Incorrect password match');
      confirmPWControl.setErrors({ MatchPassword: true });
    } else {
      console.log('password match!');

      if (confirmPWControl.hasError('MatchPassword')) {
        //check for previous error and re-validate
        confirmPWControl.setErrors({ MatchPassword: null });
        confirmPWControl.updateValueAndValidity();
      }
      return null;
    }
  }
}
