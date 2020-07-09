import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscriber } from '../subscriber.model';
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
  subscribers: Subscriber[] = [];

  //measure data mapping sequence
  subscriberSequenceArray: any[][] = [];
  expectedSubscribersCount: number;

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

    //FUTURE-UPDATE: listen to snapshot changes of payment links, and customers, if something changes there, retrigger sub function
    this.currentMerchantSub = this.currentMerchant
      .pipe(
        filter((retrievedMerchant) => retrievedMerchant !== null),
        take(1),
        mergeMap((retrievedMerchant) => {
          //only execute if merchant not null
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
          return subscriptions.map((sub) => {
            this.expectedSubscribersCount = subscriptions.length; //to calculate mapping sequence position

            //get customer that belongs from this subscription
            const customerObs = this.db
              .collection<Customer>('customers', (ref) =>
                ref.where('customer.customerID', '==', sub.customerID).limit(1)
              )
              .valueChanges();

            //get payment link that belongs to this subscription
            const paymentLinkObs = this.db
              .collection<PaymentLink>('payment-links', (ref) =>
                ref
                  .where('product.id', '==', sub.plan.productID)
                  .where('product.id', '==', sub.plan.productID)
                  .limit(1)
              )
              .valueChanges();

            return combineLatest(of(sub), customerObs, paymentLinkObs);
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
        const flattenedArr: any[] = Array.prototype.concat.apply([], data); //[[0]sub{}, [1]customer{}, [2] link{} ]

        this.subscriberSequenceArray.push(flattenedArr);

        //wait until observable sequence mapping finishes;
        if (
          this.subscriberSequenceArray.length === this.expectedSubscribersCount
        ) {
          console.log(this.subscriberSequenceArray.length);
          console.log(this.expectedSubscribersCount);

          //filter out objects that are missing relational data in the rare case, needs to be 3 items
          const filteredArr = this.subscriberSequenceArray.filter(
            (arr) => arr.length == 3
          );

          //map values to subscriber list
          this.subscribers = filteredArr.map((valueArr) => {
            const subscription = valueArr[0];
            const customer: Customer = valueArr[1];
            const paymentLink: PaymentLink = valueArr[2];

            return new Subscriber(
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
          this.expectedSubscribersCount = 0;
          this.subscriberSequenceArray = [];
        }
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
