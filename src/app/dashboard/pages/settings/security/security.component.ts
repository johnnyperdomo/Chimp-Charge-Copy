import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { NgForm, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { Subscription, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { PasswordValidation } from './security.validator';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import * as AuthActions from '../../../../auth/store/auth.actions';
import { User } from 'src/app/auth/user.model';
import { HelperService } from 'src/app/shared/helper.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
})
export class SecurityComponent implements OnInit, OnDestroy {
  @ViewChild('emailForm', { static: true }) emailForm: NgForm;
  passwordForm: FormGroup;

  currentEmail: string;

  changeEmailError: string;
  changePasswordError: string;
  isChangeEmailLoading: boolean = false;
  isChangePasswordLoading: boolean = false;

  changeDetectionSub: Subscription;
  authStoreSub: Subscription;

  constructor(
    private _cdr: ChangeDetectorRef,
    private store: Store<fromApp.AppState>,
    private auth: AngularFireAuth,
    private formBuilder: FormBuilder,
    private helperService: HelperService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupPasswordForm();

    this.changeDetectionSub = this.formObservables().subscribe(() => {
      //manually detect changes in angular
      this._cdr.detectChanges();
    });

    this.authStoreSub = this.store
      .select('auth')
      .pipe(
        map((authState) => authState.user),
        filter((payload) => payload !== null)
      )
      .subscribe((user) => {
        this.currentEmail = user.email;
      });
  }

  async onChangeEmail(emailForm: NgForm) {
    const newEmail = emailForm.value.email;
    const confirmedPassword = emailForm.value.confirmCurrentPassword;

    let credentials = firebase.auth.EmailAuthProvider.credential(
      this.currentEmail,
      confirmedPassword
    );

    this.isChangeEmailLoading = true;

    try {
      const currentUser = await this.auth.currentUser;
      await currentUser.reauthenticateWithCredential(credentials);

      await currentUser.updateEmail(newEmail);
      const newTokenResult = await currentUser.getIdTokenResult();

      const updatedUser = this.getUpdatedUser(currentUser, newTokenResult);

      //FIX: error: redo this function(this.store.dispatch), or fix: when changing email and dispatching action, page is redirected, not the intended response
      //LATER: add text: you must "update in stripe also {insert link}""
      this.store.dispatch(
        new AuthActions.AuthenticateSuccess({
          user: updatedUser,
          redirect: false,
        })
      );

      await this.helperService.updateStripeCustomerEmailMerchant(
        updatedUser.email
      );

      this.isChangeEmailLoading = false;
      this.emailForm.controls['confirmCurrentPassword'].reset();

      this.snackBar.open('Email successfully updated.', '', {
        duration: 2000,
      });
    } catch (err) {
      //FIX: sometimes when changing email i get this bug 'cannot read property 'reset' of undefined'
      this.changeEmailError = err;
      this.isChangeEmailLoading = false;

      setTimeout(() => {
        this.changeEmailError = null;
      }, 5000);
    }
  }

  async onChangePassword() {
    const currentPassword = this.passwordForm.value.currentPassword;
    const newPassword = this.passwordForm.value.newPassword;
    const confirmPassword = this.passwordForm.value.confirmPassword;

    if (!confirmPassword == newPassword) {
      return;
    }

    let credentials = firebase.auth.EmailAuthProvider.credential(
      this.currentEmail,
      currentPassword
    );

    this.isChangePasswordLoading = true;
    try {
      const currentUser = await this.auth.currentUser;

      await currentUser.reauthenticateWithCredential(credentials);

      await currentUser.updatePassword(newPassword);
      const newTokenResult = await currentUser.getIdTokenResult();

      const updatedUser = this.getUpdatedUser(currentUser, newTokenResult);

      //FIX: error: redo this function(this.store.dispatch), or fix: when changing password and dispatching action, page is redirected, not the intended response

      this.store.dispatch(
        new AuthActions.AuthenticateSuccess({
          user: updatedUser,
          redirect: false,
        })
      );

      this.isChangePasswordLoading = false;
      this.passwordForm.reset();

      this.snackBar.open('Password successfully updated.', '', {
        duration: 2000,
      });
    } catch (err) {
      this.changePasswordError = err;
      this.isChangePasswordLoading = false;

      setTimeout(() => {
        this.changePasswordError = null;
      }, 5000);
    }
  }

  setupPasswordForm() {
    this.passwordForm = this.formBuilder.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      {
        validators: PasswordValidation.MatchPassword,
      }
    );
  }

  getUpdatedUser(
    currentUser: firebase.User,
    newTokenResult: firebase.auth.IdTokenResult
  ) {
    return new User(
      currentUser.email,
      currentUser.uid,
      newTokenResult.token,
      newTokenResult.expirationTime
    );
  }

  formObservables() {
    const emailObs = this.emailForm.valueChanges;
    const passwordObs = this.passwordForm.valueChanges;

    return merge(emailObs, passwordObs);
  }

  ngOnDestroy() {
    if (this.authStoreSub) {
      this.authStoreSub.unsubscribe();
    }

    if (this.changeDetectionSub) {
      this.changeDetectionSub.unsubscribe();
    }
  }
}
