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
import * as StripeTypes from 'stripe';
import { HelperService } from '../shared/helper.service';

declare var Stripe; // : stripe.StripeStatic;

//LATER: add can deactivate child option, to save the user from accidently losing data.

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

  chargeIdempotencyKey = uuidv4(); //used to prevent duplicate charges;
  newCustomerIdempotencyKey = uuidv4();

  card;
  cardErrors;
  stripe;

  isCardElementReady: boolean = false; //card is initialized and ready to be used
  isCardPaymentComplete: boolean = false; //successful card input

  businessName: string;
  linkName: string;
  linkDescription: string;

  linkID: string;
  billingType: StripeTypes.Stripe.Price.Type;
  priceID: string;
  productID: string;

  paymentLinkDetails: string;
  checkoutBtnText: string;

  routeSub: Subscription;
  changeDetectionSub: Subscription;

  minorAmount: number;
  merchantUID: string;
  connectID: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: AngularFirestore,
    private _cdr: ChangeDetectorRef,
    private helperService: HelperService
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
          this.linkID = id;
          return from(this.db.collection('payment-links').doc(id).ref.get());
        }),
        switchMap((data) => {
          const linkData = data.data();

          if (linkData.isDeleted === true) {
            throw Error('This link has been deleted');
          }

          const merchantUID = linkData.merchantUID;

          this.minorAmount = linkData.price.unit_amount;

          const formattedPrice = MoneyFormatter.convertMinorUnitToStandard(
            linkData.price.unit_amount
          );

          this.billingType = linkData.price.type;
          this.priceID = linkData.price.id;
          this.productID = linkData.product.id;

          this.linkName = linkData.product.name;
          this.linkDescription = linkData.product.description;

          if (this.billingType === 'recurring') {
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
          this.generateNewIdempotenceKeys();

          return empty();
        })
      )
      .subscribe((merchantData) => {
        const merchant = merchantData.data();
        this.businessName = merchant.businessName;

        this.merchantUID = merchant.merchantUID;
        this.connectID = merchant.connectID;

        this.initStripeElements();
      });
  }

  initStripeElements() {
    this.stripe = Stripe(environment.stripePublishableKey, {
      stripeAccount: this.connectID,
    });
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

  generateNewIdempotenceKeys() {
    //on error; they are passed to stripe but transaction. not completed
    this.chargeIdempotencyKey = uuidv4();
    this.newCustomerIdempotencyKey = uuidv4();
  }

  async onSubmit(checkoutForm: NgForm) {
    this.isPaymentResponseLoading = true;

    const cardHolderName = checkoutForm.value.cardHolderName;

    const customerName = checkoutForm.value.customerName;
    const customerEmail = checkoutForm.value.email;

    try {
      if (checkoutForm.invalid || this.isCardPaymentComplete == false) {
        throw Error('Invalid form. Please try again!');
      }

      if (this.billingType === 'one_time') {
        //onetime
        const charge = await this.createOneTimeCharge(
          cardHolderName,
          customerEmail,
          customerName
        );

        if (charge.status && charge.status === 'succeeded') {
          this.router.navigate(['success'], { relativeTo: this.route });
        }

        this.isPaymentResponseLoading = false;
        return;
      } else {
        //recurring
        const subscription = await this.createRecurringCharge(
          cardHolderName,
          customerEmail,
          customerName
        );

        if (subscription.status && subscription.status === 'succeeded') {
          this.router.navigate(['success'], { relativeTo: this.route });
        }

        this.isPaymentResponseLoading = false;
        return;
      }
    } catch (err) {
      this.paymentResponseError = err.message;
      this.isPaymentResponseLoading = false;

      this.generateNewIdempotenceKeys();

      setTimeout(() => {
        this.paymentResponseError = null;
      }, 5000);
    }
  }

  async createOneTimeCharge(
    cardHolderName: string,
    email: string,
    customerName: string
  ) {
    try {
      if (
        !this.connectID ||
        !this.merchantUID ||
        !this.minorAmount ||
        !this.productID ||
        !this.linkName
      ) {
        throw Error('Invalid form. Please try again!');
      }

      const paymentIntent: any = await this.helperService.createPaymentIntent(
        this.minorAmount,
        { email, name: customerName },
        {
          chimp_charge_product_id: this.productID,
          chimp_charge_product_name: this.linkName,
        },
        this.connectID,
        this.merchantUID,
        this.chargeIdempotencyKey,
        this.newCustomerIdempotencyKey
      );

      const charge = await this.stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: this.card,
            billing_details: {
              name: cardHolderName,
              email,
            },
          },
          receipt_email: email,
        }
      );

      if (charge.error) {
        throw Error(charge.error.message);
      }

      return charge.paymentIntent; //paymentIntent
    } catch (err) {
      throw Error(err);
    }
  }

  // LATER: if in the future, a subscription can have a trial period for payment links, create a setup intent to handle sca
  async createRecurringCharge(
    cardHolderName: string,
    email: string,
    customerName: string
  ) {
    try {
      if (
        !this.connectID ||
        !this.merchantUID ||
        !this.priceID ||
        !this.productID ||
        !this.linkName
      ) {
        throw Error('Invalid form. Please try again!');
      }

      const paymentMethod = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: {
          name: cardHolderName,
          email,
        },
      });

      const subscription: any = await this.helperService.createSubscription(
        this.priceID,
        paymentMethod.paymentMethod.id,
        { email, name: customerName },
        {
          chimp_charge_product_id: this.productID,
          chimp_charge_product_name: this.linkName,
        },
        this.connectID,
        this.merchantUID,
        this.chargeIdempotencyKey,
        this.newCustomerIdempotencyKey
      );

      if (subscription.error) {
        throw Error(subscription.error);
      }

      const latest_invoice = subscription.latest_invoice;

      if (latest_invoice.payment_intent) {
        const { client_secret, status } = latest_invoice.payment_intent;

        if (status === 'requires_action') {
          const confirmSubscription = await this.stripe.confirmCardPayment(
            client_secret,
            {
              setup_future_usage: 'off_session', //save card for future off_session payments
              receipt_email: email,
            }
          );

          if (confirmSubscription.error) {
            throw Error(confirmSubscription.error.message);
          }

          return confirmSubscription.paymentIntent; //paymentIntent
        }
      }

      return latest_invoice.payment_intent; //payment_intent
    } catch (err) {
      throw Error(err);
    }
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
