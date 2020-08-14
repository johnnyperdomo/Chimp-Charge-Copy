import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Transaction } from '../transaction.model';
import {
  Subscription,
  BehaviorSubject,
  empty,
  concat,
  combineLatest,
  of,
} from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import {
  map,
  filter,
  mergeMap,
  catchError,
  take,
  flatMap,
} from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { HelperService } from 'src/app/shared/helper.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../../customers/customer.model';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class PaymentListComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  isLoading: boolean = false;

  dataDidLoad: boolean = false; //to see whether firebase data already loaded

  transactions: Transaction[] = [];

  //measure data mapping sequence
  transactionSequenceArray: any[][] = [];
  expectedTransactionsCount: number;

  constructor(
    private db: AngularFirestore,
    private store: Store<fromApp.AppState>,
    private helperService: HelperService,
    private zone: NgZone,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.merchantStoreSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((payload) => {
        this.currentMerchant.next(payload);
      });

    //FIX: listen to snapshot changes of customers, if something changes there, retrigger sub function
    this.currentMerchantSub = this.currentMerchant
      .pipe(
        filter((retrievedMerchant) => retrievedMerchant !== null),
        take(1),
        mergeMap((retrievedMerchant) => {
          return this.db
            .collection<any>(
              'transactions',
              (ref) =>
                ref
                  .where('merchantUID', '==', retrievedMerchant.merchantUID)
                  .where('connectID', '==', retrievedMerchant.connectID)
                  .orderBy('paymentIntent.created', 'desc') //sort: newest to last
            )
            .valueChanges({ idField: 'id' });
        }),
        mergeMap((retrievedTransactions) => {
          if (retrievedTransactions.length === 0) {
            this.dataDidLoad = true;
          }

          return retrievedTransactions.map((trans) => {
            this.expectedTransactionsCount = retrievedTransactions.length; //to calculate mapping sequence position

            //get customer that belongs from this transaction
            const customerObs = this.db
              .collection<Customer>('customers', (ref) =>
                ref
                  .where(
                    'merchantUID',
                    '==',
                    this.currentMerchant.value.merchantUID
                  )
                  .where('customer.customerID', '==', trans.customer.customerID)
                  .limit(1)
              )
              .get()
              .pipe(
                map((doc) => {
                  if (!doc.empty) {
                    return doc.docs[0].data();
                  }
                })
              );

            return combineLatest(of(trans), customerObs);
          });
        }),
        flatMap((collectionQueries) => {
          return concat(collectionQueries);
        })
      )
      .pipe(
        catchError((err) => {
          console.log(err);

          alert(
            'Unknown error, please try reloading page. Error: Firebase - ' +
              err.code
          );
          return empty();
        })
      )
      .subscribe((data) => {
        const flattenedArr: any[] = Array.prototype.concat.apply([], data); //[[0]tran{}, [1]customer{}, [2] link{} ]

        this.transactionSequenceArray.push(flattenedArr);

        //wait until observable sequence mapping finishes;
        if (
          this.transactionSequenceArray.length ===
          this.expectedTransactionsCount
        ) {
          //filter out objects that are undefined, & missing relational data in the rare case, needs to be 2 items
          const filteredArr = this.transactionSequenceArray
            .filter((arr) => arr[0] !== undefined)
            .filter((arr) => arr[1] !== undefined)
            .filter((arr) => arr.length == 2);

          //map values to transactions list
          this.transactions = filteredArr.map((valueArr) => {
            const transaction = valueArr[0];
            const customer: Customer = valueArr[1];

            return new Transaction(
              transaction.id,
              transaction.merchantUID,
              transaction.connectID,
              transaction.paymentIntent,
              transaction.customer,
              customer.customer,
              transaction.productID,
              transaction.productName,
              transaction.isRefunded,
              transaction.lastUpdated
            );
          });

          // filteredArr.map((valueArr) => {
          //   const transaction = valueArr[0];
          //   const customer: Customer = valueArr[1];

          //   console.log(transaction.customer.name);
          // });
          this.expectedTransactionsCount = 0;
          this.transactionSequenceArray = [];
          this.dataDidLoad = true;
        }
      });

    // this.transactions = data.map((i) => {
    //   return new Transaction(
    //     i.id,
    //     i.merchantUID,
    //     i.connectID,
    //     i.paymentIntent,
    //     i.originalCustomer,
    //     i.productID,
    //     i.productName,
    //     i.isRefunded,
    //     i.lastUpdated
    //   );
    // });

    //   this.dataDidLoad = true;
    // });
  }

  async onRefundAtRow(paymentIntentID: string) {
    if (
      confirm(
        `Are you sure you want to refund this transaction? \nRefunds take 5-10 days to appear on a customer's statement.`
      )
    ) {
      this.isLoading = true;
      //LATER: add loading spinner on button instead of card
      try {
        const response = await this.helperService.refundTransaction(
          paymentIntentID
        );

        this.isLoading = false;

        this.snackBar.open('Payment successfully refunded.', '', {
          duration: 2000,
        });

        return response;
      } catch (err) {
        this.isLoading = false;
        alert(err);
        //LATER: present better error
      }
    }
  }

  onCreatePaymentLink() {
    this.zone.run(() => {
      this.router.navigate(['/payment-links/new']);
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
