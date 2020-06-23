import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { PaymentLinkTypeEnum } from '../payment-link-type.enum';
import { v4 as uuidv4 } from 'uuid';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HelperService } from 'src/app/shared/helper.service';
import * as MoneyFormatter from 'src/app/shared/accounting';
import { Subscription } from 'rxjs';
import { PriceValidation } from './payment-link-edit.validator';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import * as accounting from 'src/app/shared/accounting';

//FUTURE-UPDATE: add can deactivate child option, to save the user from accidently losing data.
//FUTURE-UPDATE: add success page url

// FUTURE-UPDATE: add loading spinner before setting up form if getting data from firebase on editMode, for good ux
//FUTURE-UPDATE: do a check to see if this payment link belongs to this user, if not, don't allow to view details (security rules allow non-users to 'read' payment links but this should only be used for checkout customers.)

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
      this.linkID = params['id'];
      this.editMode = params['id'] != null;
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
    const minorCurrency = MoneyFormatter.convertStandardToMinorUnit(amount);

    if (this.editMode) {
      this.editPaymentLink(linkName, description);
    } else {
      if (this.linkType === PaymentLinkTypeEnum.onetime) {
        this.createPaymentLink(linkName, description, minorCurrency);
      } else {
        //recurring
        this.createPaymentLink(
          linkName,
          description,
          minorCurrency,
          billingInterval
        );
      }
    }
  }

  onCancelEditMode() {
    this.router.navigate(['/payment-links']);
  }

  onRecurringMode() {
    this.linkType = PaymentLinkTypeEnum.recurring;
  }

  onOneTimeMode() {
    this.linkType = PaymentLinkTypeEnum.onetime;
  }

  async createPaymentLink(
    linkName: string,
    description: string,
    amount: number,
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

      this.generateNewIdempotenceKeys();

      setTimeout(() => {
        this.error = null;
      }, 5000);
    }
  }

  async editPaymentLink(linkName: string, description: string) {
    this.isLoading = true;

    try {
      if (!this.linkID) {
        throw Error(
          'Invalid payment link ID, please try again or choose another payment link to edit'
        );
      }

      await this.helperService.editPaymentLink(
        this.linkID,
        linkName,
        description
      );

      this.isLoading = false;
      this.router.navigate(['payment-links']);
    } catch (err) {
      this.error = err.message;
      this.isLoading = false;

      this.generateNewIdempotenceKeys();

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
        const linkSnapshot = await this.db
          .doc(`payment-links/${this.linkID}`)
          .get()
          .toPromise();

        const linkData = linkSnapshot.data();

        const name = linkData.product.name;
        const desc = linkData.product.description;
        const amount = linkData.price.unit_amount;

        const priceType = linkData.price.type;

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
        //FUTURE-UPDATE: handle this error better: "couldn't load content" try again
        alert(err + ' - Try again.');
        this.router.navigate(['/payment-links/new']);
        console.log(err);
      }
    }
  }

  generateNewIdempotenceKeys() {
    //on error; they are passed to stripe but transaction. not completed
    this.productIdempotencyKey = uuidv4();
    this.priceIdempotencyKey = uuidv4();
  }

  ngOnDestroy() {
    if (this.changeDetectionSub) {
      this.changeDetectionSub.unsubscribe();
    }

    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
