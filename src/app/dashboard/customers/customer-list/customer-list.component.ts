import { Component, OnInit } from '@angular/core';
import { Customer } from '../customer.model';
import { Subscription, BehaviorSubject } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as fromApp from '../../../store/app.reducer';
import { map, filter, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
})
export class CustomerListComponent implements OnInit {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  customers: Customer[] = [
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

  constructor(
    private db: AngularFirestore,
    private store: Store<fromApp.AppState>
  ) {}

  ngOnInit(): void {
    this.merchantStoreSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((payload) => {
        this.currentMerchant.next(payload);
      });

    this.currentMerchantSub = this.currentMerchant
      .pipe(
        filter((payload) => payload !== null),
        mergeMap((retrievedMerchant) => {
          //only execute if merchant not null
          //TODO: add <Customers> to collectionref
          //TODO: , (ref) => ref.where('merchantUID', '==', retrievedMerchant.uid)
          return this.db
            .collection('customers')
            .valueChanges({ idField: 'id' });
        })
      )
      .subscribe((data) => {
        console.log(data);
      });
  }
}
