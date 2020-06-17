import { Component, OnInit, OnDestroy } from '@angular/core';
import { Customer } from '../../customers/customer.model';
import { Subscription, BehaviorSubject } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import * as fromApp from '../../../store/app.reducer';
import { Store } from '@ngrx/store';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, mergeMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-subscriber-list',
  templateUrl: './subscriber-list.component.html',
  styleUrls: ['./subscriber-list.component.scss'],
})
export class SubscriberListComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  //TODO: pseudo code => real code should grab array of customers from stripe api, and only return those who are subscribed to a payment link, whether active or cancelled.
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
          //TODO: add <Subscribers> to collectionref
          //TODO: , (ref) => ref.where('merchantUID', '==', retrievedMerchant.uid)
          return this.db
            .collection('subscriptions')
            .valueChanges({ idField: 'id' });
        })
      )
      .subscribe((data) => {
        console.log(data);
      });
  }

  ngOnDestroy() {
    if (this.merchantStoreSub) {
      this.merchantStoreSub.unsubscribe();
    }

    if (this.currentMerchant) {
      this.currentMerchant.unsubscribe();
    }

    if (this.currentMerchantSub) {
      this.currentMerchantSub.unsubscribe();
    }
  }
}
