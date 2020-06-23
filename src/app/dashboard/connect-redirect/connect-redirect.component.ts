import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { HelperService } from 'src/app/shared/helper.service';
import { ChimpApiService } from 'src/app/shared/chimp-api.service';

@Component({
  selector: 'app-connect-redirect',
  templateUrl: './connect-redirect.component.html',
  styleUrls: ['./connect-redirect.component.scss'],
})
export class ConnectRedirectComponent implements OnInit, OnDestroy {
  routeQuerySub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private helperService: HelperService,
    private chimpApi: ChimpApiService
  ) {}

  ngOnInit(): void {
    this.routeQuerySub = this.route.queryParams.subscribe((params: Params) => {
      const paramKeys = Object.keys(params);

      if (paramKeys.length === 0) {
        this.getStripeOAuthURL();
      } else {
        this.connectToStripe(params);
      }
    });
  }

  async getStripeOAuthURL() {
    try {
      const response: any = await this.chimpApi.get('/connect/stripeOAuthURL');
      const stripeURL = response.stripeURL;

      window.open(stripeURL, '_self');

      return response;
    } catch (err) {
      alert(
        'Problem connecting to stripe, please try again. Error: ' + err.error
      );
      window.close();
    }
  }

  async connectToStripe(params: Params) {
    try {
      const response: any = await this.helperService.handleStripeOAuthConnection(
        params
      );
      window.close();

      return response;
    } catch (err) {
      alert('Problem connecting to stripe, please try again. Error: ' + err);
      window.close();
    }
  }

  ngOnDestroy() {
    if (this.routeQuerySub) {
      this.routeQuerySub.unsubscribe();
    }
  }
}
