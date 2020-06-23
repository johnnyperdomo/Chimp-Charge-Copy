import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import * as AuthActions from '../store/auth.actions';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit, OnDestroy {
  @ViewChild('signupForm', { static: true }) signupForm: NgForm;

  isLoading = false;
  error: string = null;
  storeSub: Subscription;
  changeDetectionSub: Subscription;

  constructor(
    private store: Store<fromApp.AppState>,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.changeDetectionSub = this.signupForm.valueChanges.subscribe(() => {
      //manually detect changes in angular
      this._cdr.detectChanges();
    });

    this.storeSub = this.store.select('auth').subscribe((authState) => {
      this.isLoading = authState.loading;
      this.error = authState.authError;

      //FUTURE-UPDATE: add loading spinner

      if (authState.authError) {
        this.clearError();
      }
    });
  }

  //FUTURE-UPDATE: remove business name/company name from signup form, add optional in accounts page - less friction: when you add onboarding instructions
  onSubmit(signupForm: NgForm) {
    if (!signupForm.valid) {
      return;
    }

    const firstName = signupForm.value.fName;
    const lastName = signupForm.value.lName;
    const businessName = signupForm.value.bizName;

    const email = signupForm.value.email;
    const password = signupForm.value.password;

    this.authenticateUser(firstName, lastName, businessName, email, password);
  }

  authenticateUser(
    firstName: string,
    lastName: string,
    businessName: string,
    email: string,
    password: string
  ) {
    this.store.dispatch(
      new AuthActions.SignupStart({
        email: email,
        password: password,
        firstName,
        lastName,
        businessName: businessName,
      })
    );
  }

  clearError() {
    setTimeout(() => {
      this.store.dispatch(new AuthActions.ClearError());
    }, 5000); //5 seconds
  }

  ngOnDestroy() {
    if (this.storeSub) {
      this.storeSub.unsubscribe();
    }

    if (this.changeDetectionSub) {
      this.changeDetectionSub.unsubscribe();
    }
  }

  //FUTURE-UPDATE - add email verification with firebase? maybe
}
