import { Component, OnInit } from '@angular/core';
import { PaymentLink } from '../payment-link.model';
import { Router, ActivatedRoute } from '@angular/router';
import { HelperService } from 'src/app/helper.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private helperService: HelperService
  ) {}

  ngOnInit(): void {
    this.retrievePaymentLinks();
  }

  async retrievePaymentLinks() {
    try {
      const links = await this.helperService.getPaymentLinks();
      console.log('success front end, ');
    } catch (err) {
      console.log('error front end');
    }
  }

  onCreatePaymentLink() {
    this.router.navigate(['new'], { relativeTo: this.route }); //relativeTo, appends to end of current route
  }
}
