import { Component, OnInit } from '@angular/core';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [
    new Customer(
      '123fsd',
      'Johnny P',
      'Johnny@test.com',
      5,
      '$837.69',
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
      '11/17/19',
      '05/12/20',
      true
    ),
  ];

  constructor() {}

  ngOnInit(): void {}
}
