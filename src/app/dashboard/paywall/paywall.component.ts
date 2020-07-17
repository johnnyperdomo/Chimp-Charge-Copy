import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { MembershipFieldInterface } from 'src/app/shared/interfaces';
import { Merchant } from 'src/app/merchants/merchant.model';
import { HelperService } from 'src/app/shared/helper.service';

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

  isBillingPortalLoading = false;

  constructor(
    private store: Store<fromApp.AppState>,
    private helperService: HelperService
  ) {}

  ngOnInit(): void {
    $('#signupModal,#expiredModal,#cancelledModal').modal({
      show: false,
      backdrop: 'static',
    });

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

      // don't close if same modal is already open
      if (!$('#signupModal').is(':visible')) {
        this.hideAllModals();
      }

      this.showSignupModal();
    } else if (
      membership.status === 'past_due' ||
      membership.status === 'unpaid'
    ) {
      // expired modal

      // don't close if same modal is already open
      if (!$('#expiredModal').is(':visible')) {
        this.hideAllModals();
      }

      this.showExpiredModal();
    } else if (membership.status === 'canceled') {
      // cancelled modal

      // don't close if same modal is already open
      if (!$('#cancelledModal').is(':visible')) {
        this.hideAllModals();
      }

      this.showCancelledModal();
    } else if (
      membership.status === 'active' ||
      membership.status === 'trialing'
    ) {
      // no modal => success
      this.hideAllModals();
    }
  }

  async onCreateBillingPortalSession() {
    try {
      this.isBillingPortalLoading = true;
      const portalSession: any = await this.helperService.createBillingPortalSession();
      const portalURL = portalSession.url;

      window.open(portalURL);

      this.isBillingPortalLoading = false;
      return portalSession;
    } catch (err) {
      this.isBillingPortalLoading = false;
      alert(
        'Problem connecting to stripe, please try again. Error: ' + err.error
      );
    }
  }

  // jquery

  //TODO: check if multiple shows on a modal already opened causes issues
  showSignupModal(): void {
    // $('#signupModal').modal({ backdrop: 'static', keyboard: false });
    $('#signupModal').modal('show');
  }

  showExpiredModal(): void {
    // $('#expiredModal').modal({
    //   backdrop: 'static',
    //   keyboard: false,
    //   show: true,
    // });
    $('#expiredModal').modal('show');
  }

  showCancelledModal(): void {
    //  $('#cancelledModal').modal({ backdrop: 'static', keyboard: false });
    $('#cancelledModal').modal('show');
  }

  hideSignupModal(): void {
    //  $('.modal').modal({ backdrop: 'static', keyboard: false });
    //  $('.modal').modal('hide');
    $('#signupModal').modal('hide');
  }

  //TODO: hide all modals
  hideExpiredModal(): void {
    //  $('.modal').modal({ backdrop: 'static', keyboard: false });
    //  $('.modal').modal('hide');
    $('#expiredModal').modal('hide');
  }

  hideCancelledModal(): void {
    //  $('.modal').modal({ backdrop: 'static', keyboard: false });
    //  $('.modal').modal('hide');
    $('#cancelledModal').modal('hide');
  }

  hideAllModals(): void {
    //  $('.modal').modal({ backdrop: 'static', keyboard: false });
    $('.modal').modal('hide');
  }

  ngOnDestroy() {
    this.currentMerchant = null;
  }
}
