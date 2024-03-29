import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { Store } from '@ngrx/store';
import { map, filter } from 'rxjs/operators';
import { MerchantService } from 'src/app/merchants/merchants.service';
import { Merchant } from 'src/app/merchants/merchant.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { HelperService } from 'src/app/shared/helper.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit, OnDestroy {
  @ViewChild('accountForm', { static: true }) accountForm: NgForm;

  firstName: string;
  lastName: string;
  businessName: string;
  merchant: Merchant;

  changeDetectionSub: Subscription;
  merchantStoreSub: Subscription;

  constructor(
    private _cdr: ChangeDetectorRef,
    private store: Store<fromApp.AppState>,
    private merchantService: MerchantService,
    private db: AngularFirestore,
    private helperService: HelperService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.changeDetectionSub = this.accountForm.valueChanges.subscribe(() => {
      //manually detect changes in angular
      this._cdr.detectChanges();
    });

    this.merchantStoreSub = this.store
      .select('merchant')
      .pipe(
        map((merchantState) => merchantState.merchant),
        filter((payload) => payload !== null)
      )
      .subscribe((merchant) => {
        this.merchant = merchant;

        this.firstName = merchant.firstName;
        this.lastName = merchant.lastName;
        this.businessName = merchant.businessName;
      });
  }

  async onSubmit(accountForm: NgForm) {
    // LATER: add loading spinner

    if (!accountForm.valid) {
      return;
    }

    const firstName = accountForm.value.fName;
    const lastName = accountForm.value.lName;
    const businessName = accountForm.value.bizName;
    //LATER: add text: you must "update bizName in stripe also {insert link}""

    try {
      await this.db
        .collection('merchants')
        .doc(this.merchant.merchantUID)
        .update({
          firstName,
          lastName,
          businessName,
        });

      await this.helperService.updateStripeCustomerNameMerchant(
        `${firstName} ${lastName}`,
        businessName
      );

      //FIX: reconfigure function, cuz this tries to get data from server again, instead of just getting it locally; there's lag on client side
      this.merchantService.getMerchantInfo(this.merchant.merchantUID);

      this.snackBar.open('Settings successfully updated.', '', {
        duration: 2000,
      });
    } catch (err) {
      alert(err + ' - Try Again.');
      //LATER: present error
    }
  }

  ngOnDestroy() {
    if (this.merchantStoreSub) {
      this.merchantStoreSub.unsubscribe();
    }

    if (this.changeDetectionSub) {
      this.changeDetectionSub.unsubscribe();
    }
  }
}
