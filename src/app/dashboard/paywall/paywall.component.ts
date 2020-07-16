import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { MembershipFieldInterface } from 'src/app/shared/interfaces';
import { Merchant } from 'src/app/merchants/merchant.model';

// This lets me use jquery
declare var $: any;

@Component({
  selector: 'app-paywall',
  templateUrl: './paywall.component.html',
  styleUrls: ['./paywall.component.scss'],
})
export class PaywallComponent implements OnInit, OnDestroy {
  merchantSub: Subscription;
  currentMerchant: Merchant = null;

  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit(): void {
    this.merchantSub = this.store
      .select('merchant')
      .pipe(
        map((merchantState) => merchantState.merchant),

        // filter out duplicate merchants to eliminate listen to getting object of previous event with the new event
        filter((merchant) => merchant !== this.currentMerchant)
      )
      .subscribe((merchant) => {
        if (merchant) {
          this.currentMerchant = merchant;
          console.log(merchant);

          this.determinePaywallType(merchant.membership);
        }
      });
  }

  determinePaywallType(membership: MembershipFieldInterface) {
    if (
      !membership ||
      membership.status === 'incomplete' ||
      membership.status === 'incomplete_expired'
    ) {
      // signup modal
      this.hideModals();

      this.showSignupModal();
      console.log('signup');
    } else if (
      membership.status === 'past_due' ||
      membership.status === 'unpaid'
    ) {
      // expired modal
      this.hideModals();

      console.log('expired');
      this.showExpiredModal();
    } else if (membership.status === 'canceled') {
      // cancelled modal
      console.log('cancelled');
      this.hideModals();

      this.showCancelledModal();
    } else if (
      membership.status === 'active' ||
      membership.status === 'trialing'
    ) {
      // no modal => success
      console.log('none');
      this.hideModals();
    }
  }

  // jquery functions to open modals in html

  //TODO: check if multpiple shows on a modal already opened causes issues
  showSignupModal(): void {
    $('#signupModal').modal({ backdrop: 'static', keyboard: false });
    $('#signupModal').modal('show');
  }

  showExpiredModal(): void {
    $('#expiredModal').modal({ backdrop: 'static', keyboard: false });
    $('#expiredModal').modal('show');
  }

  showCancelledModal(): void {
    $('#cancelledModal').modal({ backdrop: 'static', keyboard: false });
    $('#cancelledModal').modal('show');
  }

  //TODO: hide all modals
  hideModals(): void {
    $('.modal').modal('hide');
  }

  ngOnDestroy() {
    this.currentMerchant = null;
  }
}
