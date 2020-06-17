import { Component, OnInit, OnDestroy } from '@angular/core';
import { Payment } from '../payment.model';
import { Subscription, BehaviorSubject } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { map, filter, mergeMap } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as fromApp from '../../../store/app.reducer';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
})
export class PaymentListComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  payments: Payment[] = [
    new Payment(
      '1Qsd23r',
      'Johnny J',
      'johnny@jim.com',
      '30.84',
      'Plumbing',
      'Success',
      '11/1/2020',
      'Single'
    ),
    new Payment(
      '4rwe5Re',
      'Bobby B',
      'bobby@bob.com',
      '50',
      'Marketing Service',
      'Dispute',
      '11/18/2020',
      'Recurring'
    ),
    new Payment(
      'sf34fsd',
      'Peter T',
      'peter@thiel.com',
      '80',
      'Graphic Logo',
      'Refunded',
      '11/19/2020',
      'Single'
    ),
    new Payment(
      '3E32f2',
      'Lenny L',
      'lenny@lion.com',
      '24.57',
      'Consultation Fee',
      'Success',
      '11/20/2020',
      'Recurring'
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
          //TODO: add <Payments> to collectionref
          //TODO: , (ref) => ref.where('merchantUID', '==', retrievedMerchant.uid)
          return this.db
            .collection('transactions')
            .valueChanges({ idField: 'id' });
        })
      )
      .subscribe((data) => {
        console.log(data);
      });
  }

  onRefundAtRow(itemID: string) {
    console.log('refund clicked, ' + itemID);
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
