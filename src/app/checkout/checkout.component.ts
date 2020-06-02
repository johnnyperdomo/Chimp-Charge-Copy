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
  merchantName = 'Johnny Perdomo';
  linkName = 'Marketing Services';
  linkDescription = 'Marketing services rendered for atlanta consulting inc.';
  linkType = 'One-Time';
  price = '$10'; //stripe price

  constructor() {}

  ngOnInit(): void {
    this.stripe = Stripe(environment.stripePublishableKey); //TODO:
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
