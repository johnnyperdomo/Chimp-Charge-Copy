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

//NEXT-UPDATE: add sorting abilities, and pagination
@Component({
  selector: 'app-payment-link-list',
  templateUrl: './payment-link-list.component.html',
  styleUrls: ['./payment-link-list.component.scss'],
})
export class PaymentLinkListComponent implements OnInit, OnDestroy {
  paymentLinks: PaymentLink[] = [];

  merchantStoreSub: Subscription;
  currentMerchantSub: Subscription;
  currentMerchant = new BehaviorSubject<Merchant>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: AngularFirestore,
    private store: Store<fromApp.AppState>,
    private helperService: HelperService,
    private linkService: PaymentLinkService
  ) {}

  ngOnInit(): void {
    //TODO: //add loading spinner
    //TODO: catch errors
    //NEXT-UPDATE// turn into ngrx reducer
    //NEXT-UPDATE: render content faster
    console.log('onit called');

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
            .collection<PaymentLink>('payment-links', (ref) =>
              ref
                .where('merchantUID', '==', retrievedMerchant.uid)
                .where('connectID', '==', retrievedMerchant.stripeConnectID)
            )
            .valueChanges({ idField: 'id' });
        })
      )
      .subscribe((data) => {
        console.log(data);

        this.paymentLinks = data.map((item) => {
          return new PaymentLink(
            item.id,
            item.merchantUID,
            item.product,
            item.price,
            item.lastUpdated
          );
        });
        console.log(this.paymentLinks);
      });
  }

  onCreatePaymentLink() {
    this.router.navigate(['new'], { relativeTo: this.route }); //relativeTo, appends to end of current route
  }

  onViewLinkAtRow(itemID: string) {
    console.log('view link, ' + itemID);
  }

  onCopyLinkAtRow(itemID: string) {
    console.log('copied link, ' + itemID);

    this.linkService.copyPayLink(itemID);

    //TODO: add alert upon success
  }

  onEditLinkAtRow(itemID: string) {
    console.log('edit clicked, ' + itemID);
  }

  async onDeleteLinkAtRow(itemID: string) {
    const currentLink = this.paymentLinks.find((item) => item.id === itemID);
    const merchant = this.currentMerchant.getValue();

    try {
      const response = await this.helperService.deletePaymentLink(
        currentLink.price.id,
        currentLink.product.id,
        merchant.stripeConnectID
      );
      return response;
    } catch (err) {
      console.log(err);
      //TODO: present error
    }

    //TODO: add alert upon success
    //TODO: add modal to confirm deletion - ngbootstrap modal
  }

  ngOnDestroy() {
    if (this.merchantStoreSub) {
      this.merchantStoreSub.unsubscribe();
    }

    if (this.currentMerchantSub) {
      this.currentMerchantSub.unsubscribe();
    }
  }
}
