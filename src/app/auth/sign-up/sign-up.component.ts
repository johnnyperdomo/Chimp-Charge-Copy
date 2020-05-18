import { Component, OnInit, OnDestroy } from '@angular/core';
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
  isLoading = false;
  error: string = null;
  storeSub: Subscription;

  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit(): void {
    this.storeSub = this.store.select('auth').subscribe((authState) => {
      this.isLoading = authState.loading;
      this.error = authState.authError;

      //NEXT-UPDATE: add loading spinner

      if (authState.authError) {
        this.clearError();
      }
    });
  }

  onSubmit(signupForm: NgForm) {
    if (!signupForm.valid) {
      return;
    }

    const firstName = signupForm.value.fName;
    const lastName = signupForm.value.lName;
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
  }

  //NEXT-UPDATE - add email verification with firebase
}
