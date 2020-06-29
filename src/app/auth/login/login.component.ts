import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import * as AuthActions from '../store/auth.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('loginForm', { static: true }) loginForm: NgForm;

  isLoading = false;
  error: string = null;
  storeSub: Subscription;
  changeDetectionSub: Subscription;

  constructor(
    private store: Store<fromApp.AppState>,
    private _cdr: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.changeDetectionSub = this.loginForm.valueChanges.subscribe(() => {
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

  onSubmit(loginForm: NgForm) {
    if (!loginForm.valid) {
      return;
    }

    const email = loginForm.value.email;
    const password = loginForm.value.password;

    this.authenticateUser(email, password);
  }

  authenticateUser(email: string, password: string) {
    this.store.dispatch(
      new AuthActions.LoginStart({ email: email, password: password })
    );
  }

  goToSignupPage() {
    this.zone.run(() => {
      this.router.navigate(['/signup']);
    });
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
}
