import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';

@Component({
  selector: 'app-payouts',
  templateUrl: './payouts.component.html',
  styleUrls: ['./payouts.component.scss'],
})
export class PayoutsComponent implements OnInit, OnDestroy {
  merchantSub: Subscription;
  isStripeConnectAuthorized: boolean = false;

  constructor(private store: Store<fromApp.AppState>, private zone: NgZone) {}
  ngOnInit(): void {
    this.zone.run(() => {
      this.merchantSub = this.store
        .select('merchant')
        .pipe(
          map((merchantState) => merchantState.merchant),
          filter((merchant) => merchant !== null)
        )
        .subscribe((merchant) => {
          console.log('merchants');
          this.isStripeConnectAuthorized = !merchant.connectID ? false : true;
        });
    });
  }

  openStripeOAuthFlow() {
    const currentURL = location.origin;
    const redirectURL = currentURL + '/connect-redirect';
    window.open(redirectURL, '_blank');
  }

  ngOnDestroy() {
    if (this.merchantSub) {
      this.merchantSub.unsubscribe();
    }
  }
}
