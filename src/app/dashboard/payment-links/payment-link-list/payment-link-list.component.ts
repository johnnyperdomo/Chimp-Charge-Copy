import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaymentLink } from '../payment-link.model';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, mergeMap, filter } from 'rxjs/operators';
import * as fromApp from '../../../store/app.reducer';
import { Store } from '@ngrx/store';
import { Subscription, BehaviorSubject } from 'rxjs';
import { Merchant } from 'src/app/merchants/merchant.model';
import { HelperService } from 'src/app/helper.service';
import { PaymentLinkService } from '../payment-link.service';
import { Clipboard } from '@angular/cdk/clipboard';

//FUTURE-UPDATE: add sorting abilities, and pagination
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
    //FUTURE-UPDATE: //add loading spinner
    //TODO: catch errors
    //FUTURE-UPDATE// turn into ngrx reducer
    //FUTURE-UPDATE: render content faster

    this.merchantStoreSub = this.store
      .select('merchant')
      .pipe(map((merchantState) => merchantState.merchant))
      .subscribe((payload) => {
        this.currentMerchant.next(payload);
      });

    this.currentMerchantSub = this.currentMerchant
      .pipe(
        filter((payload) => payload !== null),
        mergeMap((retrievedMerchant) => {
          //only execute if merchant not null

          return this.db
            .collection<PaymentLink>(
              'payment-links',
              (ref) =>
                ref
                  .where(
                    'merchantInfo.merchantUID',
                    '==',
                    retrievedMerchant.uid
                  )
                  .where(
                    'merchantInfo.connectID',
                    '==',
                    retrievedMerchant.stripeConnectID
                  )
                  .orderBy('product.created', 'desc') //sort: newest to last
            )
            .valueChanges({ idField: 'id' });
        })
      )
      .subscribe((data) => {
        this.paymentLinks = data.map((item) => {
          return new PaymentLink(
            item.id,
            item.merchantInfo,
            item.product,
            item.price,
            item.lastUpdated
          );
        });
        console.log(this.paymentLinks);
      });
  }

  onCreatePaymentLink() {
    this.router.navigate(['new'], { relativeTo: this.route });
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

    //TODO: add alert upon success
  }

  onEditLinkAtRow(itemID: string) {
    console.log('edit clicked, ' + itemID);
    this.router.navigate([`${itemID}/edit`], { relativeTo: this.route });
  }

  async onDeleteLinkAtRow(itemID: string) {
    const currentLink = this.paymentLinks.find((item) => item.id === itemID);

    if (
      confirm(
        `Are you sure you want to delete the '${currentLink.product.name}' payment link? \n You will no longer be able to accept new payments with this link.`
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
        alert(err + ' - Try Again');
        console.log(err);
        //FUTURE-UPDATE: present error
      }
    }

    //TODO: add alert upon success
    //FUTURE-UPDATE: add modal to confirm deletion - ngbootstrap modal; js.confirm is ugly!!!
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
