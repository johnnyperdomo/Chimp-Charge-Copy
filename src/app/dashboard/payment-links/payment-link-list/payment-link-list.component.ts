import { Component, OnInit } from '@angular/core';
import { PaymentLink } from '../payment-link.model';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-link-list',
  templateUrl: './payment-link-list.component.html',
  styleUrls: ['./payment-link-list.component.scss'],
})
export class PaymentLinkListComponent implements OnInit {
  paymentLinks: PaymentLink[] = [
    new PaymentLink('234fd4', 'Marketing Fee', 'Recurring', '$300', '11/12/20'),
    new PaymentLink('48Rfd4', 'Logo Design', 'Single', '$175', '11/12/20'),
    new PaymentLink(
      'tevfd4',
      'Consultation Service',
      'Recurring',
      '$850',
      '11/12/20'
    ),
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {}

  onCreatePaymentLink() {
    this.router.navigate(['new'], { relativeTo: this.route }); //relativeTo, appends to end of current route
  }
}