import { Component, OnInit } from '@angular/core';
import { Customer } from '../../customers/customer.model';

@Component({
  selector: 'app-subscriber-list',
  templateUrl: './subscriber-list.component.html',
  styleUrls: ['./subscriber-list.component.scss'],
})
export class SubscriberListComponent implements OnInit {
  //TODO: pseudo code => real code should grab array of customers from stripe api, and only return those who are subscribed to a plan, whether active or cancelled.
  subscribers: Customer[] = [
    new Customer(
      '123fsd',
      'Johnny P',
      'Johnny@test.com',
      5,
      '$837.69',
      'Marketing Fee',
      '11/17/19',
      '05/12/20',
      true
    ),
    new Customer(
      '3fsd56',
      'Bobby P',
      'Bobb@test.com',
      10,
      '$8377.69',
      'Consultation 30 mins',
      '11/17/19',
      '05/12/20',
      false
    ),
    new Customer(
      '543fsd',
      'tommy P',
      'tommy@test.com',
      7,
      '$250',
      'Logo Design',
      '11/17/19',
      '05/12/20',
      true
    ),
  ];

  constructor() {}

  ngOnInit(): void {}
}
