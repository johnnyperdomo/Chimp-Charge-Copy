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
import { from } from 'rxjs';
import * as MoneyFormatter from 'src/app/accounting';

declare var Stripe; // : stripe.StripeStatic;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  @ViewChild('cardElement', { static: true }) cardElement: ElementRef;
  //TODO: add can deactivate child option, to save the user from accidently losing data.

  idempotencyKey = uuidv4(); //used to prevent duplicate charges; generated on component load

  stripe; // : stripe.Stripe;
  card;
  cardErrors;

  //TODO: add dynamic values
  businessName: string;
  linkName: string;
  linkDescription: string;
  linkType: string;
  price: string; //stripe price

  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

  ngOnInit(): void {
    //TODO: add loading page before rendering checkout
    //TODO: catchError, show 404 page if no data find with id
    //TODO: add business name to checkout page
    this.route.params
      .pipe(
        map((params) => {
          return params['id'];
        }),
        switchMap((id) => {
          console.log('id is => ' + id);

          return from(this.db.collection('payment-links').doc(id).ref.get());
        }),
        switchMap((paymentLinkData) => {
          const retrievedLink = paymentLinkData.data();
          const merchantUID = retrievedLink.merchantUID;

          const formattedPrice = MoneyFormatter.convertMinorUnitToStandard(
            retrievedLink.price.unit_amount
          );

          this.price = formattedPrice;
          this.linkType = retrievedLink.price.type;
          this.linkName = retrievedLink.product.name;
          this.linkDescription = retrievedLink.product.description;

          console.log(retrievedLink);

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
      });

    this.activeCard();
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
}

//TODO: unsubscribe from route sub
//TODO: generate new idempotence key on error
