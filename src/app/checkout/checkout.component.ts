import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, switchMap, catchError } from 'rxjs/operators';
import { from, Subscription, empty } from 'rxjs';
import * as MoneyFormatter from 'src/app/shared/accounting';

declare var Stripe; // : stripe.StripeStatic;

//FUTURE-UPDATE: add can deactivate child option, to save the user from accidently losing data.

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('checkoutForm', { static: true }) checkoutForm: NgForm;
  @ViewChild('cardElement', { static: true }) cardElement: ElementRef;

  isPaymentResponseLoading: boolean = false;
  paymentResponseError: string;

  isCheckoutFormLoading: boolean = true;
  checkoutFormRenderingError: string;

  idempotencyKey = uuidv4(); //used to prevent duplicate charges;

  stripe; // : stripe.Stripe;
  card;
  cardErrors;

  isCardElementReady: boolean = false; //card is initialized and ready to be used
  isCardPaymentComplete: boolean = false; //successful card input

  businessName: string;
  linkName: string;
  linkDescription: string;

  paymentLinkDetails: string;
  checkoutBtnText: string;

  routeSub: Subscription;
  changeDetectionSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: AngularFirestore,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.changeDetectionSub = this.checkoutForm.valueChanges.subscribe(() => {
      this._cdr.detectChanges();
    });

    this.routeSub = this.route.params
      .pipe(
        map((params) => {
          return params['id'];
        }),
        switchMap((id) => {
          return from(this.db.collection('payment-links').doc(id).ref.get());
        }),
        switchMap((data) => {
          const linkData = data.data();
          const merchantUID = linkData.merchantInfo.merchantUID;

          const formattedPrice = MoneyFormatter.convertMinorUnitToStandard(
            linkData.price.unit_amount
          );

          const billingType = linkData.price.type;

          this.linkName = linkData.product.name;
          this.linkDescription = linkData.product.description;

          if (billingType === 'recurring') {
            const recurring = linkData.price.recurring;
            const recurringInterval: string = recurring.interval;

            this.paymentLinkDetails = `${formattedPrice} - Every ${recurringInterval} [Subscription]`;

            this.checkoutBtnText = `Pay ${formattedPrice} Every ${recurringInterval}`;
          } else {
            this.paymentLinkDetails = `${formattedPrice}`;
            this.checkoutBtnText = `Pay ${formattedPrice}`;
          }

          return from(
            this.db.collection('merchants').doc(merchantUID).ref.get()
          );
        })
      )
      .pipe(
        catchError((err) => {
          this.checkoutFormRenderingError = err;
          this.isCheckoutFormLoading = false;
          this.generateNewIdempotenceKey();

          return empty();
        })
      )
      .subscribe((merchantData) => {
        const merchant = merchantData.data();
        this.businessName = merchant.businessName;

        this.initStripeElements();
      });
  }

  initStripeElements() {
    this.stripe = Stripe(environment.stripePublishableKey);
    const elements = this.stripe.elements();

    this.card = elements.create('card');
    this.card.mount(this.cardElement.nativeElement);

    this.card.addEventListener('change', (event) => {
      const error = event.error;
      this.cardErrors = error && error.message;

      this.isCardPaymentComplete = event.complete ? true : false;
    });

    this.card.addEventListener('ready', () => {
      //present checkoutForm to user when card is active
      this.isCheckoutFormLoading = false;
      this.checkoutFormRenderingError = null;
    });
  }

  generateNewIdempotenceKey() {
    //on error; they are passed to stripe but transaction. not completed
    this.idempotencyKey = uuidv4();
  }

  onSubmit(checkoutForm: NgForm) {
    //TODO: spam button to test for duplicate charges and idempotency key works

    if (checkoutForm.invalid || this.isCardPaymentComplete == false) {
      return;
    }

    //TODO: handle success case
    this.router.navigate(['success'], { relativeTo: this.route });

    console.log(checkoutForm.value);
    console.log(this.idempotencyKey);
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
