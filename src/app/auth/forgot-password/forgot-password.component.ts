import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild('forgotPasswordForm', { static: true }) forgotPasswordForm: NgForm;

  didSendResetInstructions: boolean = false;

  constructor(
    private auth: AngularFireAuth,
    private router: Router,
    private zone: NgZone
  ) {}

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

  goToSignupPage() {
    this.zone.run(() => {
      this.router.navigate(['/signup']);
    });
  }

  goToLoginPage() {
    this.zone.run(() => {
      this.router.navigate(['/login']);
    });
  }
}
