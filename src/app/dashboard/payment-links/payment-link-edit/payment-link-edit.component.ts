import { Component, OnInit } from '@angular/core';
import { PaymentLinkTypeEnum } from '../payment-link-type.enum';
import { BillingInterval } from '../billing-interval.enum';
import { v4 as uuidv4 } from 'uuid';
import { NgForm } from '@angular/forms';
import { HelperService } from 'src/app/helper.service';

@Component({
  selector: 'app-payment-link-edit',
  templateUrl: './payment-link-edit.component.html',
  styleUrls: ['./payment-link-edit.component.scss'],
})
export class PaymentLinkEditComponent implements OnInit {
  productIdempotencyKey: string = uuidv4(); //used to prevent duplicate charges; generated on component load
  priceIdempotencyKey: string = uuidv4();

  //TODO: add can deactivate child option, to save the user from accidently losing data.
  linkType = PaymentLinkTypeEnum.recurring;
  billingInterval = BillingInterval.monthly;

  constructor(private helperService: HelperService) {}

  ngOnInit(): void {}

  onSubmit(linkForm: NgForm) {
    const amount: number = linkForm.value.amount;
    const linkName: string = linkForm.value.linkName;
    let description: string = linkForm.value.description;

    //TODO: empty description throws error in stripe
    if (!description || description.length == 0) {
      description = undefined;
    }

    console.log(this.productIdempotencyKey);
    console.log('amount, ' + linkForm.value.amount);
    console.log('product name, ' + linkForm.value.linkName);
    console.log('description, ' + description);
    console.log('billing interval, ' + this.billingInterval);
    this.createPaymentLink(amount, linkName, description);
  }

  onRecurringMode() {
    this.linkType = PaymentLinkTypeEnum.recurring;
    console.log('recurring');
  }

  onOneTimeMode() {
    this.linkType = PaymentLinkTypeEnum.onetime;
    console.log('onetime');
  }

  async createPaymentLink(
    amount: number,
    linkName: string,
    description: string
  ) {
    console.log('desc, ' + description);

    try {
      const createLink = await this.helperService.createPaymentLink(
        this.productIdempotencyKey,
        this.priceIdempotencyKey,
        amount,
        linkName,
        description
      );
      console.log('success from front end,');
    } catch (err) {
      console.log('any errors from payment link component, ' + err);
    }
  }

  //TODO: use 'dinero.js' to convert user inputs with stripe lowest currency: 50 = 5000. //fromFloat; standard
}
