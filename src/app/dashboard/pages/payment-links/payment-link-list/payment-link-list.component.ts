import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaymentLink } from '../payment-link.model';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, mergeMap, filter, catchError, take } from 'rxjs/operators';
import * as fromApp from 'src/app/shared/app-store/app.reducer';
import { Store } from '@ngrx/store';
import { Subscription, BehaviorSubject, empty } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { HelperService } from 'src/app/shared/helper.service';
import { PaymentLinkService } from '../payment-link.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-payment-link-list',
  templateUrl: './payment-link-list.component.html',
  styleUrls: ['./payment-link-list.component.scss'],
})
export class PaymentLinkListComponent implements OnInit, OnDestroy {
  paymentLinks: PaymentLink[] = [];

  isLoading: boolean = false;

  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: AngularFirestore,
    private store: Store<fromApp.AppState>,
    private helperService: HelperService,
    private linkService: PaymentLinkService,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    //LATER: add sorting abilities, and pagination

    //LATER: //add loading spinner
    //LATER// turn into ngrx reducer
    //LATER: render content faster

    this.merchantStoreSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((payload) => {
        this.currentMerchant.next(payload);
        console.log('current merchant', this.currentMerchant.getValue());
      });

    //LATER: sometimes this emits sub 3 times on reload: fix maybe? check other subs in outher lists
    this.currentMerchantSub = this.currentMerchant
      .pipe(
        filter((retrievedMerchant) => retrievedMerchant !== null),
        take(1),
        mergeMap((retrievedMerchant) => {
          //only execute if merchant not null

          return this.db
            .collection<PaymentLink>(
              'payment-links',
              (ref) =>
                ref
                  .where('merchantUID', '==', retrievedMerchant.merchantUID)
                  .where('connectID', '==', retrievedMerchant.connectID)
                  .where('isDeleted', '==', false)
                  .orderBy('product.created', 'desc') //sort: newest to last
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
        this.paymentLinks = data.map((i) => {
          return new PaymentLink(
            i.id,
            i.merchantUID,
            i.connectID,
            i.product,
            i.price,
            i.lastUpdated
          );
        });
        console.log(this.paymentLinks);
      });
  }

  onViewLinkAtRow(itemID: string) {
    console.log('view link, ' + itemID);

    const payLink = this.linkService.copyPayLink(itemID);
    window.open(payLink); //TODO: make sure page loads on production
  }

  onCopyLinkAtRow(itemID: string) {
    console.log('copied link, ' + itemID);

    const payLink = this.linkService.copyPayLink(itemID);
    this.clipboard.copy(payLink);

    //LATER: add alert upon success
  }

  onEditLinkAtRow(itemID: string) {
    this.router.navigate([`${itemID}/edit`], { relativeTo: this.route });
  }

  async onDeleteLinkAtRow(itemID: string) {
    const currentLink = this.paymentLinks.find((item) => item.id === itemID);

    if (
      confirm(
        `Are you sure you want to delete the '${currentLink.product.name}' payment link? \nYou will no longer be able to accept new payments with this link.`
      )
    ) {
      this.isLoading = true;
      try {
        const response = await this.helperService.deletePaymentLink(
          currentLink.price.id,
          currentLink.product.id
        );
        this.isLoading = false;
        return response;
      } catch (err) {
        this.isLoading = false;
        alert(err + ' - Try Again');
        console.log(err);
        //LATER: present error
      }
    }

    //TODO: add alert upon success
    //LATER: add modal to confirm deletion - ngbootstrap modal; js.confirm is ugly!!!
  }

  ngOnDestroy() {
    if (this.merchantStoreSub) {
      this.merchantStoreSub.unsubscribe();
    }

    if (this.currentMerchantSub) {
      this.currentMerchantSub.unsubscribe();
    }

    if (this.currentMerchant) {
      this.currentMerchant.unsubscribe();
    }
  }
}
