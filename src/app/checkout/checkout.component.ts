import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

declare var Stripe; // : stripe.StripeStatic;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  @ViewChild('cardElement', { static: true }) cardElement: ElementRef;

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
    this.stripe = Stripe('pk_test_khkMMjikeE7R9TusvTgIOLv7000UOUZmeJ');
    const elements = this.stripe.elements();

    this.card = elements.create('card');
    this.card.mount(this.cardElement.nativeElement);

    this.card.addEventListener('change', ({ error }) => {
      this.cardErrors = error && error.message;
    });
  }

  onSubmit(checkoutForm: NgForm) {
    console.log(checkoutForm.value);
  }
}
