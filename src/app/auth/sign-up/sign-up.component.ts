import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
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
    private changeDetectionRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.changeDetectionSub = this.signupForm.valueChanges.subscribe(() => {
      //manually detect changes in angular
      this.changeDetectionRef.detectChanges();
    });

    this.storeSub = this.store.select('auth').subscribe((authState) => {
      this.isLoading = authState.loading;
      this.error = authState.authError;

      //NEXT-UPDATE: add loading spinner

      if (authState.authError) {
        this.clearError();
      }
    });
  }

  //NEXT-UPDATE: remove business name/company name from signup form, add optional in accounts page
  onSubmit(signupForm: NgForm) {
    if (!signupForm.valid) {
      return;
    }

    const firstName = signupForm.value.fName;
    const lastName = signupForm.value.lName;
    //TODO: add business/company name option here

    const email = signupForm.value.email;
    const password = signupForm.value.password;

    this.authenticateUser(firstName, lastName, email, password);
  }

  authenticateUser(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) {
    this.store.dispatch(
      new AuthActions.SignupStart({
        email: email,
        password: password,
        firstName,
        lastName,
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

  //NEXT-UPDATE - add email verification with firebase? maybe
}
