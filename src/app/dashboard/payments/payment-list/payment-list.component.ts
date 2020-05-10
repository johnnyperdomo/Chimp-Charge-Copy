import { Component, OnInit } from '@angular/core';
import { Payment } from '../payment.model';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [
    new Payment(
      '1Qsd23r',
      'Johnny J',
      'johnny@jim.com',
      '30.84',
      'Success',
      '11/1/2020',
      'Single'
    ),
    new Payment(
      '4rwe5Re',
      'Bobby B',
      'bobby@bob.com',
      '50',
      'Dispute',
      '11/18/2020',
      'Recurring'
    ),
    new Payment(
      'sf34fsd',
      'Peter T',
      'peter@thiel.com',
      '80',
      'Refunded',
      '11/19/2020',
      'Single'
    ),
    new Payment(
      '3E32f2',
      'Lenny L',
      'lenny@lion.com',
      '24.57',
      'Success',
      '11/20/2020',
      'Recurring'
    ),
  ];

  constructor() {}

  ngOnInit(): void {}
}
