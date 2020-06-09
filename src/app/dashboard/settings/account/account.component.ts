import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as fromApp from '../../../store/app.reducer';
import { Store } from '@ngrx/store';
import { map, filter } from 'rxjs/operators';
import { MerchantService } from 'src/app/merchants/merchants.service';
import { Merchant } from 'src/app/merchants/merchant.model';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  @ViewChild('accountForm', { static: true }) signupForm: NgForm;

  firstName: string;
  lastName: string;
  businessName: string;
  merchant: Merchant;

  changeDetectionSub: Subscription;
  merchantStoreSub: Subscription;

  constructor(
    private changeDetectionRef: ChangeDetectorRef,
    private store: Store<fromApp.AppState>,
    private merchantService: MerchantService,
    private db: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.changeDetectionSub = this.signupForm.valueChanges.subscribe(() => {
      //manually detect changes in angular
      this.changeDetectionRef.detectChanges();
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
    console.log(accountForm);

    if (!accountForm.valid) {
      return;
    }

    const firstName = accountForm.value.fName;
    const lastName = accountForm.value.lName;
    const businessName = accountForm.value.bizName;

    try {
      await this.db.collection('merchants').doc(this.merchant.uid).update({
        firstName,
        lastName,
        businessName,
      });

      //NEXT-UPDATE: reconfigure function, cuz this tries to get data from server again, instead of just getting it locally; there's lag on client side
      this.merchantService.getMerchantInfo(this.merchant.uid);
    } catch (err) {
      console.log(err);
      //TODO: present error
    }

    //TODO: present alert on success
  }
}
