import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  onSubmit(signupForm: NgForm) {
    if (!signupForm.valid) {
      return;
    }

    const firstName = signupForm.value.fName;
    const lastName = signupForm.value.lName;
    const email = signupForm.value.email;
    const password = signupForm.value.password;

    console.log(email, password, firstName, lastName);
    //TODO: Firebase auth
    signupForm.reset();
  }
}
