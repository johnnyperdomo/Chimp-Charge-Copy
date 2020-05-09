import { Component, OnInit } from '@angular/core';
import { Payment } from '../payment.model';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [
    new Payment('1', 'Johnny J', '30', 'Success', '11/1/2020', 'Single'),
    new Payment('2', 'Bobby B', '50', 'Dispute', '11/18/2020', 'Recurring'),
    new Payment('3', 'Peter T', '80', 'Refunded', '11/19/2020', 'Single'),
    new Payment('4', 'Lenny L', '24', 'Success', '11/20/2020', 'Recurring'),
  ];

  constructor() {}

  ngOnInit(): void {}
}
