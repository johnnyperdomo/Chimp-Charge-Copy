import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit {
 //FUTURE-UPDATE: paymentsLastThirtyDays = '$2,534'; //pseudo code
  customerCount = 9; //pseudo code
  activeSubscriberCount = 3;
  paymentsTotal = '$17,543';

  constructor() {}

  ngOnInit(): void {}
}
