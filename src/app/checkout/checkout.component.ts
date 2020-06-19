import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, switchMap, catchError } from 'rxjs/operators';
import { from, Subscription } from 'rxjs';
import * as MoneyFormatter from 'src/app/accounting';

declare var Stripe; // : stripe.StripeStatic;

//FUTURE-UPDATE: add can deactivate child option, to save the user from accidently losing data.

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('cardElement', { static: true }) cardElement: ElementRef;

  idempotencyKey = uuidv4(); //used to prevent duplicate charges;

  stripe; // : stripe.Stripe;
  card;
  cardErrors;

  businessName: string;
  linkName: string;
  linkDescription: string;

  paymentLinkDetails: string;
  checkoutBtnText: string;

  routeSub: Subscription;

  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

  ngOnInit(): void {
    //TODO: add loading page before rendering checkout
    //TODO: catchError, show 404 page if no data find with id
    this.routeSub = this.route.params
      .pipe(
        map((params) => {
          return params['id'];
        }),
        switchMap((id) => {
          console.log('id is => ' + id);

          return from(this.db.collection('payment-links').doc(id).ref.get());
        }),
        switchMap((data) => {
          const linkData = data.data();
          const merchantUID = linkData.merchantUID;

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
      .subscribe((merchantData) => {
        const merchant = merchantData.data();
        this.businessName = merchant.businessName;
        console.log(merchantData.data());
        //TODO: Render content here => after data finishes loading

        this.activeCard();
      });
  }

  activeCard() {
    this.stripe = Stripe(environment.stripePublishableKey);
    const elements = this.stripe.elements();

    this.card = elements.create('card');
    this.card.mount(this.cardElement.nativeElement);

    this.card.addEventListener('change', ({ error }) => {
      this.cardErrors = error && error.message;
    });
  }

  onSubmit(checkoutForm: NgForm) {
    //TODO: spam button to test for duplicate charges and idempotency key works
    console.log(checkoutForm.value);
    console.log(this.idempotencyKey);
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}

//TODO: unsubscribe from route sub
//TODO: generate new idempotence key on error
