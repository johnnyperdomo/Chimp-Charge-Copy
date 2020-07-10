import { Component, OnInit, OnDestroy } from '@angular/core';
import { Payment } from '../payment.model';
import { Subscription, BehaviorSubject, empty } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { map, filter, mergeMap, catchError, take } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { HelperService } from 'src/app/shared/helper.service';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
})
export class PaymentListComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  isLoading: boolean = false;

  payments: Payment[] = [];

  constructor(
    private db: AngularFirestore,
    private store: Store<fromApp.AppState>,
    private helperService: HelperService
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
        filter((retrievedMerchant) => retrievedMerchant !== null),
        take(1),
        mergeMap((retrievedMerchant) => {
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
            'Unknown error, please try reloading page. Error: Firebase - ' +
              err.code
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

  async onRefundAtRow(paymentIntentID: string) {
    if (
      confirm(
        `Are you sure you want to refund this transaction? \n Refunds take 5-10 days to appear on a customer's statement.`
      )
    ) {
      this.isLoading = true;
      //FUTURE-UPDATE: add loading spinner on button instead of card
      try {
        const response = await this.helperService.refundTransaction(
          paymentIntentID
        );

        this.isLoading = false;
        return response;
      } catch (err) {
        this.isLoading = false;
        alert(err);
        console.log(err);
        //FUTURE-UPDATE: present better error
      }

      console.log('refund clicked, ' + paymentIntentID);
    }
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
