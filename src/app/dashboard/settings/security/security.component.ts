import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import {
  NgForm,
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import * as fromApp from '../../../store/app.reducer';
import { Subscription, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { PasswordValidation } from './security.validator';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import * as AuthActions from '../../../auth/store/auth.actions';
import { User } from 'src/app/auth/user.model';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
})
export class SecurityComponent implements OnInit {
  @ViewChild('emailForm', { static: true }) emailForm: NgForm;
  //@ViewChild('passwordForm', { static: true }) passwordForm: NgForm;
  passwordForm: FormGroup;

  currentEmail: string;

  changeDetectionSub: Subscription;
  authStoreSub: Subscription;

  constructor(
    private changeDetectionRef: ChangeDetectorRef,
    private store: Store<fromApp.AppState>,
    private auth: AngularFireAuth,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.setupPasswordForm();

    this.changeDetectionSub = this.formObservables().subscribe(() => {
      //manually detect changes in angular
      this.changeDetectionRef.detectChanges();
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
    //TODO: reauthenticate with popul modal like how stripe does it, ask for pw

    const newEmail = emailForm.value.email;

    let credentials = firebase.auth.EmailAuthProvider.credential(
      this.currentEmail,
      '12345678'
    ); //TODO: prompt to enter password

    try {
      const currentUser = await this.auth.currentUser;
      await currentUser.reauthenticateWithCredential(credentials);

      await currentUser.updateEmail(newEmail);
      const newTokenResult = await currentUser.getIdTokenResult();

      const updatedUser = this.getUpdatedUser(currentUser, newTokenResult);

      //NEXT-UPDATE: error: redo this function, or fix: when changing email and dispatching action, page is redirected, not the intended response

      //NEXT-UPDATE: add text: you must "update in stripe also {insert link}""
      this.store.dispatch(
        new AuthActions.AuthenticateSuccess({
          user: updatedUser,
          redirect: false,
        })
      );

      //TODO: trigger success alert
    } catch (err) {
      console.log(err);

      //TODO: Present err
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

    try {
      const currentUser = await this.auth.currentUser;
      await currentUser.reauthenticateWithCredential(credentials);

      await currentUser.updatePassword(newPassword);
      const newTokenResult = await currentUser.getIdTokenResult();

      const updatedUser = this.getUpdatedUser(currentUser, newTokenResult);

      this.store.dispatch(
        new AuthActions.AuthenticateSuccess({
          user: updatedUser,
          redirect: false,
        })
      );

      //TODO: trigger success alert

      this.passwordForm.reset();
      console.log('success');
    } catch (err) {
      console.log(err);
      //TODO: present error
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
}