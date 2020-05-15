import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import * as AuthActions from '../store/auth.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  error: string = null;
  storeSub: Subscription;

  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit(): void {
    this.storeSub = this.store.select('auth').subscribe((authState) => {
      this.isLoading = authState.loading;
      this.error = authState.authError;

      //TODO: get authState details
      //TODO: add loading spinner

      if (authState.authError) {
        this.clearError();
      }
    });
  }

  onSubmit(loginForm: NgForm) {
    if (!loginForm.valid) {
      return;
    }

    const email = loginForm.value.email;
    const password = loginForm.value.password;

    console.log(email, password);
    this.authenticateUser(email, password);
  }

  authenticateUser(email: string, password: string) {
    this.store.dispatch(
      new AuthActions.LoginStart({ email: email, password: password })
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
}
