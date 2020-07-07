import { Component, OnInit, OnDestroy } from '@angular/core';
import { Payment } from '../payment.model';
import { Subscription, BehaviorSubject, empty } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { map, filter, mergeMap, catchError } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
})
export class PaymentListComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  payments: Payment[] = [];

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
            .collection<Payment>(
              'transactions',
              (ref) =>
                ref
                  .where('merchantUID', '==', retrievedMerchant.merchantUID)
                  .where('connectID', '==', retrievedMerchant.connectID)
                  .orderBy('paymentIntent.created', 'desc') //sort: newest to last
            )
            .valueChanges({ idField: 'id' });
        })
      )
      .pipe(
        catchError((err) => {
          alert(
            'Unknown error, please try again. Error: Firebase - ' + err.code
          );
          return empty();
        })
      )
      .subscribe((data) => {
        this.payments = data.map((i) => {
          return new Payment(
            i.id,
            i.merchantUID,
            i.connectID,
            i.paymentIntent,
            i.customer,
            i.productID,
            i.productName,
            i.isRefunded,
            i.lastUpdated
          );
        });

        console.log(this.payments);
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
