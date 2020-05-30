import { Component, OnInit } from '@angular/core';
import { PaymentLinkTypeEnum } from '../payment-link-type.enum';
import { BillingInterval } from '../billing-interval.enum';
import { v4 as uuidv4 } from 'uuid';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-payment-link-edit',
  templateUrl: './payment-link-edit.component.html',
  styleUrls: ['./payment-link-edit.component.scss'],
})
export class PaymentLinkEditComponent implements OnInit {
  idempotency_key = uuidv4(); //used to prevent duplicate charges; generated on component load

  //TODO: add can deactivate child option, to save the user from accidently losing data.
  linkType = PaymentLinkTypeEnum.recurring;
  billingInterval = BillingInterval.monthly;

  constructor() {}

  ngOnInit(): void {}

  onSubmit(linkForm: NgForm) {
    console.log(this.idempotency_key);
  }

  onRecurringMode() {
    this.linkType = PaymentLinkTypeEnum.recurring;
    console.log('recurring');
  }

  onOneTimeMode() {
    this.linkType = PaymentLinkTypeEnum.onetime;
    console.log('onetime');
  }
}
