import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { Subscription, BehaviorSubject, empty, combineLatest } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { map, filter, mergeMap, catchError, take } from 'rxjs/operators';
import { AggStats } from './agg-stats.model';
import { CurrencyStats } from './currency-stats.model';
@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styles: [],
})
export class StatsComponent implements OnInit, OnDestroy {
  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  aggStats: AggStats = null; //aggregation map
  currencyStats: CurrencyStats = null; //currency aggregation map

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
        filter((retrievedMerchant) => retrievedMerchant !== null),
        filter((merchant) => merchant.connectID !== null),
        take(1),
        mergeMap((retrievedMerchant) => {
          const aggregationObs = this.db
            .collection('aggregations')
            .doc<AggStats>(retrievedMerchant.connectID)
            .valueChanges();

          const currencyAggregationObs = this.db
            .collection(`aggregations`)
            .doc(retrievedMerchant.connectID)
            .collection('currencies')
            .doc<CurrencyStats>('usd')
            .valueChanges();

          return combineLatest(aggregationObs, currencyAggregationObs);
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
        //LATER: check to see if field item exists, if not, return 0

        const agg = data[0];
        const currency = data[1];

        if (agg) {
          this.aggStats = new AggStats(
            agg.merchantUID,
            agg.connectID,
            agg.customerCount,
            agg.subscriptions
          );
        }

        if (currency) {
          this.currencyStats = new CurrencyStats(
            currency.merchantUID,
            currency.connectID,
            currency.transactions
          );
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
