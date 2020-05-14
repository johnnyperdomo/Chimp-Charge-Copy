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
  private storeSub: Subscription;

  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit(): void {
    this.storeSub = this.store.select('auth').subscribe((authState) => {
      console.log(authState.authError);

      //TODO: get authState details
      if (authState.authError) {
        console.log(
          'yay, this works on sign up component Error => ',
          authState.authError
        );
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

    console.log(email, password, firstName, lastName);

    this.authenticateUser(firstName, lastName, email, password);
  }

  authenticateUser(
    fName: string,
    lName: string,
    email: string,
    password: string
  ) {
    this.store.dispatch(
      new AuthActions.SignupStart({ email: email, password: password })
    );
  }

  ngOnDestroy() {
    if (this.storeSub) {
      this.storeSub.unsubscribe();
    }
  }

  //NEXT-UPDATE - add email verification with firebase
}
