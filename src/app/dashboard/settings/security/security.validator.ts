import { FormGroup } from '@angular/forms';

export function passwordMatchValidator(g: FormGroup) {
  return g.get('newPassword').value === g.get('confirmPassword').value
    ? null
    : { mismatch: true };
}
