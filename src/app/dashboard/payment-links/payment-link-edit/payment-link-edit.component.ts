import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { PaymentLinkTypeEnum } from '../payment-link-type.enum';
import { v4 as uuidv4 } from 'uuid';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HelperService } from 'src/app/helper.service';
import * as MoneyFormatter from 'src/app/accounting';
import { Subscription } from 'rxjs';
import { PriceValidation } from './payment-link-edit.validator';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import * as accounting from 'src/app/accounting';

//FUTURE-UPDATE: add can deactivate child option, to save the user from accidently losing data.
//FUTURE-UPDATE: add success page url

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
  routeSub: Subscription;

  isLoading: boolean = false;
  error: string;

  linkID: string;
  editMode: boolean = false;

  linkType = PaymentLinkTypeEnum.onetime;

  constructor(
    private helperService: HelperService,
    private formBuilder: FormBuilder,
    private _cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private db: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe((params: Params) => {
      //+ turns string into number
      this.linkID = params['id'];
      this.editMode = params['id'] != null; //edit mode is true, if id does not equal null. only with id

      console.log('edit mode ', this.editMode);
      console.log('link ', this.linkID);

      this.setupLinkEditForm();
    });

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

    const billingInterval = this.paymentLinkEditForm.value.billingInterval;
    console.log(billingInterval);

    const minorCurrency = MoneyFormatter.convertStandardToMinorUnit(amount);

    if (this.linkType === PaymentLinkTypeEnum.onetime) {
      this.createPaymentLink(minorCurrency, linkName, description);
    } else {
      //recurring
      this.createPaymentLink(
        minorCurrency,
        linkName,
        description,
        billingInterval
      );
    }
  }

  onRecurringMode() {
    this.linkType = PaymentLinkTypeEnum.recurring;
  }

  onOneTimeMode() {
    this.linkType = PaymentLinkTypeEnum.onetime;
  }

  async createPaymentLink(
    amount: number,
    linkName: string,
    description: string,
    interval: string = null
  ) {
    this.isLoading = true;
    try {
      await this.helperService.createPaymentLink(
        this.productIdempotencyKey,
        this.priceIdempotencyKey,
        amount,
        linkName,
        description,
        interval
      );

      this.isLoading = false;
      this.router.navigate(['payment-links']);
    } catch (err) {
      this.error = err.message;
      this.isLoading = false;

      setTimeout(() => {
        this.error = null;
      }, 5000);
    }
  }

  async setupLinkEditForm() {
    this.paymentLinkEditForm = this.formBuilder.group(
      {
        linkName: ['', Validators.required],
        description: [''],
        amount: [null, [Validators.required]],
        billingInterval: ['month', [Validators.required]],
      },
      {
        validators: PriceValidation.ConfirmPriceRange,
      }
    );

    if (this.editMode) {
      try {
        console.log('in here');

        const linkSnapshot = await this.db
          .doc(`payment-links/${this.linkID}`)
          .get()
          .toPromise();

        const linkData = linkSnapshot.data();

        const name = linkData.product.name;
        const desc = linkData.product.description;
        const amount = linkData.price.unit_amount;

        const priceType = linkData.price.type;

        console.log(linkData);

        this.paymentLinkEditForm.patchValue({
          linkName: name,
          description: desc,
          amount: accounting.unformatAmount(amount),
        });

        if (priceType === 'one_time') {
          this.onOneTimeMode();
        } else if (priceType === 'recurring') {
          this.onRecurringMode();

          const recurringInterval = linkData.price.recurring.interval;

          this.paymentLinkEditForm.patchValue({
            billingInterval: recurringInterval,
          });
        }
      } catch (err) {
        //FUTURE-UPDATE: handle this error better
        this.router.navigate(['/payment-links/new']);
        console.log(err);
      }
    }
  }

  ngOnDestroy() {
    if (this.changeDetectionSub) {
      this.changeDetectionSub.unsubscribe();
    }
  }
}
