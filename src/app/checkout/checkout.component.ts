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
          const merchantUID = linkData.merchantInfo.merchantUID;

          this.minorAmount = linkData.price.unit_amount;

          const formattedPrice = MoneyFormatter.convertMinorUnitToStandard(
            linkData.price.unit_amount
          );

          this.billingType = linkData.price.type;
          this.priceID = linkData.price.id;

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
          this.generateNewIdempotenceKey();

          return empty();
        })
      )
      .subscribe((merchantData) => {
        const merchant = merchantData.data();
        this.businessName = merchant.businessName;

        this.merchantUID = merchant.uid;
        this.connectID = merchant.stripeConnectID;

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

  generateNewIdempotenceKey() {
    //on error; they are passed to stripe but transaction. not completed
    this.idempotencyKey = uuidv4();
  }

  async onSubmit(checkoutForm: NgForm) {
    console.log('on submit');
    this.isPaymentResponseLoading = true;

    console.log('init');

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

        if (
          charge.paymentIntent.status &&
          charge.paymentIntent.status === 'succeeded'
        ) {
          console.log('successssss!!!!');
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
        console.log('recurring', subscription);

        return;
      }
    } catch (err) {
      this.paymentResponseError = err.message;
      this.isPaymentResponseLoading = false;

      this.generateNewIdempotenceKey();

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
        !this.linkID
      ) {
        throw Error('Invalid form. Please try again!');
      }

      const paymentIntent: any = await this.helperService.createPaymentIntent(
        this.minorAmount,
        { email, name: customerName },
        {
          chimp_charge_payment_link_id: this.linkID,
        },
        this.connectID,
        this.merchantUID,
        this.idempotencyKey
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

      return charge;
    } catch (err) {
      console.log('one time err', err);
      throw Error(err);
    }
  }

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
        !this.linkID
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
          chimp_charge_payment_link_id: this.linkID,
        },
        this.connectID,
        this.merchantUID,
        this.idempotencyKey
      );

      if (subscription.error) {
        console.log('sub error', subscription.error.message);
      }

      const latest_invoice = subscription.latest_invoice;

      if (latest_invoice.payment_intent) {
        const { client_secret, status } = latest_invoice.payment_intent;

        if (status === 'requires_action') {
          console.log('requires action');

          const confirmSubscription = await this.stripe.confirmCardPayment(
            client_secret
          );

          if (confirmSubscription.error) {
            throw Error(confirmSubscription.error.message);
          }

          return confirmSubscription;
        }
      }

      console.log(subscription);

      return subscription;
    } catch (err) {
      console.log('there is an error called here');

      console.log('err.err.error', err.error.error);
      console.log('err.err.me', err.error.message);
      console.log(err);

      throw Error(err.message);
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
