import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { MembershipFieldInterface } from 'src/app/shared/interfaces';
import { Merchant } from 'src/app/merchants/merchant.model';
import { HelperService } from 'src/app/shared/helper.service';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import * as firebase from 'firebase/app';

// This lets me use jquery
declare var $: any;
declare var Stripe; // : stripe.StripeStatic;

@Component({
  selector: 'app-paywall',
  templateUrl: './paywall.component.html',
  styleUrls: ['./paywall.component.scss'],
})
export class PaywallComponent implements OnInit, OnDestroy {
  @ViewChild('signupCardElement', { static: true })
  signupCardElement: ElementRef;
  @ViewChild('expiredCardElement', { static: true })
  expiredCardElement: ElementRef;
  @ViewChild('cancelledCardElement', { static: true })
  cancelledCardElement: ElementRef;

  merchantSub: Subscription;
  currentMerchant: Merchant;
  currentUser: firebase.User; //from auth

  isBillingPortalLoading: boolean = false;

  chargeIdempotencyKey = uuidv4(); //used to prevent duplicate charges;
  newCustomerIdempotencyKey = uuidv4(); //rare that customer is not already created

  card;
  cardErrors;
  stripe;

  isCardPaymentComplete: boolean = false; //successful card input
  isPaymentResponseLoading: boolean = false;
  paymentResponseError: string;

  constructor(
    private store: Store<fromApp.AppState>,
    private helperService: HelperService
  ) {}

  ngOnInit(): void {
    // to disable the closing of modal on outside click with jquery
    $('#signupModal,#expiredModal,#cancelledModal').modal({
      show: false,
      backdrop: 'static',
    });

    this.initStripeElements();

    this.merchantSub = this.store
      .select('merchant')
      .pipe(
        map((merchantState) => merchantState.merchant),

        // filter out duplicate merchants to eliminate listen to getting object of previous event with the new event
        filter((merchant) => merchant !== this.currentMerchant)
      )
      .subscribe((merchant) => {
        if (merchant) {
          this.currentMerchant = merchant;
          console.log(merchant);
          this.currentUser = firebase.auth().currentUser;

          this.determinePaywallType(merchant.membership);
        }
      });
  }

  determinePaywallType(membership: MembershipFieldInterface) {
    if (!membership) {
      // signup modal

      // don't close if same modal is already open
      if (!$('#signupModal').is(':visible')) {
        this.hideAllModals();
      }

      this.showSignupModal();
    } else if (
      membership.status === 'past_due' ||
      membership.status === 'unpaid'
    ) {
      // expired modal

      // don't close if same modal is already open
      if (!$('#expiredModal').is(':visible')) {
        this.hideAllModals();
      }

      this.showExpiredModal();
    } else if (membership.status === 'canceled') {
      // cancelled modal

      // don't close if same modal is already open
      if (!$('#cancelledModal').is(':visible')) {
        this.hideAllModals();
      }

      this.showCancelledModal();
    } else if (
      membership.status === 'active' ||
      membership.status === 'trialing'
    ) {
      // no modal => success
      this.hideAllModals();
    }
  }

  initStripeElements() {
    this.stripe = Stripe(environment.stripePublishableKey);
    const elements = this.stripe.elements();

    this.card = elements.create('card');

    this.card.addEventListener('change', (event) => {
      const error = event.error;
      this.cardErrors = error && error.message;
      this.isCardPaymentComplete = event.complete ? true : false;
    });
  }

  // TODO:
  // async onCreateBillingPortalSession() {
  //   try {
  //     this.isBillingPortalLoading = true;
  //     const portalSession: any = await this.helperService.createBillingPortalSession();
  //     const portalURL = portalSession.url;

  //     window.open(portalURL);

  //     this.isBillingPortalLoading = false;
  //     return portalSession;
  //   } catch (err) {
  //     this.isBillingPortalLoading = false;
  //     alert(
  //       'Problem connecting to stripe, please try again. Error: ' + err.error
  //     );
  //   }
  // }

  async onUpdateCard() {
    //TODO: update the card, and then manually attempt to pay the invoice
  }

  async onCreateTrialSubscription() {
    try {
      //TODO
    } catch (error) {
      this.paymentResponseError = error.message;
      this.isPaymentResponseLoading = false;

      this.generateNewIdempotenceKeys();

      setTimeout(() => {
        this.paymentResponseError = null;
      }, 5000);
    }
  }

  async onReactivateSubscription() {
    this.isPaymentResponseLoading = true;

    try {
      if (!this.currentMerchant || !this.currentUser) {
        throw Error('Credentials not complete. Please try reloading page.');
      }

      const paymentMethod = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: {
          name: `${this.currentMerchant.firstName} ${this.currentMerchant.lastName}`,
          email: this.currentUser.email,
        },
      });

      const subscription: any = await this.helperService.reactivateMerchantSubscription(
        paymentMethod.paymentMethod.id,
        this.chargeIdempotencyKey
      );

      console.log(subscription);

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
              receipt_email: this.currentUser.email,
            }
          );

          console.log(confirmSubscription);

          if (confirmSubscription.error) {
            throw Error(confirmSubscription.error.message);
          }

          console.log('latest, incoice, ', latest_invoice);

          this.isPaymentResponseLoading = false;
          return; //paymentIntent
        }
      }

      this.isPaymentResponseLoading = true;
      return; //payment_intent
    } catch (error) {
      console.log(error.message);

      this.paymentResponseError = error.message;
      this.isPaymentResponseLoading = false;

      this.generateNewIdempotenceKeys();

      setTimeout(() => {
        this.paymentResponseError = null;
      }, 5000);
    }
  }

  generateNewIdempotenceKeys() {
    //on error; they are passed to stripe but transaction. not completed
    this.chargeIdempotencyKey = uuidv4();
    this.newCustomerIdempotencyKey = uuidv4();
  }

  // jquery
  showSignupModal(): void {
    this.card.mount(this.signupCardElement.nativeElement);
    $('#signupModal').modal('show');
  }

  showExpiredModal(): void {
    this.card.mount(this.expiredCardElement.nativeElement);
    $('#expiredModal').modal('show');
  }

  showCancelledModal(): void {
    this.card.mount(this.cancelledCardElement.nativeElement);
    $('#cancelledModal').modal('show');
  }

  hideAllModals(): void {
    // set back to initial state
    this.card.unmount();
    this.cardErrors = null;
    this.isCardPaymentComplete = false;
    this.paymentResponseError = null;
    this.isPaymentResponseLoading = false;

    $('.modal').modal('hide');
  }

  ngOnDestroy() {
    if (this.currentMerchant) {
      this.currentMerchant = null;
    }

    if (this.merchantSub) {
      this.merchantSub.unsubscribe();
    }

    if (this.currentUser) {
      this.currentUser = null;
    }
  }
}
