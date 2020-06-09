import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as fromApp from '../../../store/app.reducer';
import { Subscription, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { passwordMatchValidator } from './security.validator';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import * as AuthActions from '../../../auth/store/auth.actions';

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
    private auth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.setupPasswordForm();

    this.changeDetectionSub = this.formObservables().subscribe(() => {
      //manually detect changes in angular
      console.log('changes detected');
      console.log(this.currentEmail);

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
      //TODO: UPDATE local auth reducer when this happens
      //TODO: check local storage, if that updates when i update user
    } catch (err) {
      console.log(err);

      //TODO: Present err
    }

    console.log(emailForm.value.email);
  }

  onChangePassword() {
    console.log(this.passwordForm.value);
  }

  setupPasswordForm() {
    this.passwordForm = new FormGroup({
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  formObservables() {
    const emailObs = this.emailForm.valueChanges;
    const passwordObs = this.passwordForm.valueChanges;

    return merge(emailObs, passwordObs);
  }
}
