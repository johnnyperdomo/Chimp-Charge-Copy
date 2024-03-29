import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription as SubscriptionModel } from '../subscription.model';
import {
  Subscription,
  BehaviorSubject,
  empty,
  combineLatest,
  concat,
  of,
} from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import * as fromApp from '../../../../shared/app-store/app.reducer';
import { Store } from '@ngrx/store';
import { AngularFirestore } from '@angular/fire/firestore';
import {
  map,
  mergeMap,
  filter,
  take,
  catchError,
  flatMap,
} from 'rxjs/operators';
import { Customer } from '../../customers/customer.model';
import { PaymentLink } from '../../payment-links/payment-link.model';
import { HelperService } from 'src/app/shared/helper.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-subscription-list',
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.scss'],
})
export class SubscriptionListComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  isLoading: boolean = false;

  subscriptions: SubscriptionModel[] = [];

  dataDidLoad: boolean = false; //to see whether firebase data already loaded

  //measure data mapping sequence
  subscriptionSequenceArray: any[][] = [];
  expectedSubscriptionsCount: number;

  constructor(
    private db: AngularFirestore,
    private store: Store<fromApp.AppState>,
    private helperService: HelperService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.merchantStoreSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((payload) => {
        this.currentMerchant.next(payload);
      });

    //FIX: listen to snapshot changes of payment links, and customers, if something changes there, retrigger sub function
    this.currentMerchantSub = this.currentMerchant
      .pipe(
        filter((retrievedMerchant) => retrievedMerchant !== null),
        take(1),
        mergeMap((retrievedMerchant) => {
          return this.db
            .collection<any>(
              'subscriptions',
              (ref) =>
                ref
                  .where('merchantUID', '==', retrievedMerchant.merchantUID)
                  .where('connectID', '==', retrievedMerchant.connectID)
                  .orderBy('subscription.created', 'desc') //sort: newest to last
            )
            .valueChanges({ idField: 'id' });
        }),
        mergeMap((subscriptions) => {
          if (subscriptions.length === 0) {
            this.dataDidLoad = true;
          }

          return subscriptions.map((sub) => {
            this.expectedSubscriptionsCount = subscriptions.length; //to calculate mapping sequence position

            //get customer that belongs from this subscription
            const customerObs = this.db
              .collection<Customer>('customers', (ref) =>
                ref
                  .where(
                    'merchantUID',
                    '==',
                    this.currentMerchant.value.merchantUID
                  )
                  .where('customer.customerID', '==', sub.customerID)
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

            //get payment link that belongs to this subscription
            const paymentLinkObs = this.db
              .collection<PaymentLink>('payment-links', (ref) =>
                ref
                  .where(
                    'merchantUID',
                    '==',
                    this.currentMerchant.value.merchantUID
                  )
                  .where('product.id', '==', sub.plan.productID)
                  .where('product.id', '==', sub.plan.productID)
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

            return combineLatest(of(sub), customerObs, paymentLinkObs);
          });
        }),
        flatMap((collectionQueries) => {
          return concat(collectionQueries);
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
        const flattenedArr: any[] = Array.prototype.concat.apply([], data); //[[0]sub{}, [1]customer{}, [2] link{} ]
        this.subscriptionSequenceArray.push(flattenedArr);

        //wait until observable sequence mapping finishes;
        if (
          this.subscriptionSequenceArray.length === this.expectedSubscriptionsCount
        ) {
          //filter out objects that are undefined, & missing relational data in the rare case, needs to be 3 items
          const filteredArr = this.subscriptionSequenceArray
            .filter((arr) => arr[0] !== undefined)
            .filter((arr) => arr[1] !== undefined)
            .filter((arr) => arr[2] !== undefined)
            .filter((arr) => arr.length == 3);

          //map values to subscription list
          this.subscriptions = filteredArr.map((valueArr) => {
            const subscription = valueArr[0];
            const customer: Customer = valueArr[1];
            const paymentLink: PaymentLink = valueArr[2];

            return new SubscriptionModel(
              subscription.id,
              subscription.merchantUID,
              subscription.connectID,
              customer.customer,
              subscription.status,
              {
                created: paymentLink.product.created,
                paymentLinkID: paymentLink.id,
                name: paymentLink.product.name,
                description: paymentLink.product.description,
                amount: paymentLink.price.unit_amount,
                billingInterval:
                  paymentLink.price.recurring &&
                  paymentLink.price.recurring.interval,
              },
              subscription.subscription,
              subscription.lastUpdated
            );
          });
          this.expectedSubscriptionsCount = 0;
          this.subscriptionSequenceArray = [];
          this.dataDidLoad = true;
        }
      });
  }

  async onCancelSubAtRow(subscriptionID: string) {
    if (
      confirm(
        `Are you sure you want to cancel this subscription? \nYou will not be able to re-active it.`
      )
    ) {
      this.isLoading = true;
      //LATER: add loading spinner on button instead of card
      try {
        const response = await this.helperService.cancelSubscription(
          subscriptionID
        );

        this.isLoading = false;

        this.snackBar.open('Subscription successfully cancelled.', '', {
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
