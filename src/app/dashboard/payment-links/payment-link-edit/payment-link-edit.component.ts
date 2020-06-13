import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { PaymentLinkTypeEnum } from '../payment-link-type.enum';
import { v4 as uuidv4 } from 'uuid';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HelperService } from 'src/app/helper.service';
import * as MoneyFormatter from 'src/app/accounting';
import { Subscription } from 'rxjs';
import { PriceValidation } from './payment-link-edit.validator';
import { Router } from '@angular/router';

//NEXT-UPDATE: add can deactivate child option, to save the user from accidently losing data.
//NEXT-UPDATE: add success page url

@Component({
  selector: 'app-payment-link-edit',
  templateUrl: './payment-link-edit.component.html',
  styleUrls: ['./payment-link-edit.component.scss'],
})
export class PaymentLinkEditComponent implements OnInit, OnDestroy {
  paymentLinkEditForm: FormGroup;

  productIdempotencyKey: string = uuidv4();
  priceIdempotencyKey: string = uuidv4();

  changeDetectionSub: Subscription;

  isLoading: boolean = false;
  error: string;

  linkType = PaymentLinkTypeEnum.onetime;

  constructor(
    private helperService: HelperService,
    private formBuilder: FormBuilder,
    private _cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupLinkEditForm();

    this.changeDetectionSub = this.paymentLinkEditForm.valueChanges.subscribe(
      () => {
        this._cdr.detectChanges();
      }
    );
  }

  onSubmit() {
    const amount: number = this.paymentLinkEditForm.value.amount;
    const linkName: string = this.paymentLinkEditForm.value.linkName;
    const description: string = this.paymentLinkEditForm.value.description;

    console.log(this.productIdempotencyKey);

    const minorCurrency = MoneyFormatter.convertStandardToMinorUnit(amount);

    this.createPaymentLink(minorCurrency, linkName, description);
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
    this.isLoading = true;
    try {
      await this.helperService.createPaymentLink(
        this.productIdempotencyKey,
        this.priceIdempotencyKey,
        amount,
        linkName,
        description
      );

      this.isLoading = false;
      this.router.navigate(['payment-links']);
    } catch (err) {
      this.error = err.message;

      setTimeout(() => {
        this.error = null;
      }, 5000);
    }
  }

  setupLinkEditForm() {
    this.paymentLinkEditForm = this.formBuilder.group(
      {
        linkName: ['', Validators.required],
        description: [''],
        amount: [null, [Validators.required]],
        billingInterval: ['monthly', [Validators.required]],
      },
      {
        validators: PriceValidation.ConfirmPriceRange,
      }
    );
  }

  ngOnDestroy() {
    if (this.changeDetectionSub) {
      this.changeDetectionSub.unsubscribe();
    }
  }
}
