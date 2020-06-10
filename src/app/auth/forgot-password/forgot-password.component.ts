import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild('forgotPasswordForm', { static: true }) forgotPasswordForm: NgForm;

  didSendResetInstructions: boolean = false;

  constructor(private auth: AngularFireAuth) {}

  //TODO: test reset email
  ngOnInit(): void {}

  onSubmit(forgotPasswordForm: NgForm) {
    const email = forgotPasswordForm.value.email;

    if (!email) {
      return;
    }

    this.auth.sendPasswordResetEmail(email);

    //don't care about promise result; present 'success' response
    this.didSendResetInstructions = true;
    forgotPasswordForm.resetForm();
  }
}
