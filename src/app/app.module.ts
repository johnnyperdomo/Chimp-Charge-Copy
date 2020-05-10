import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './dashboard/header/header.component';
import { PaymentsComponent } from './dashboard/payments/payments.component';
import { CustomersComponent } from './dashboard/customers/customers.component';
import { SubscribersComponent } from './dashboard/subscribers/subscribers.component';
import { PlansComponent } from './dashboard/plans/plans.component';
import { SettingsComponent } from './dashboard/settings/settings.component';
import { AccountComponent } from './dashboard/settings/account/account.component';
import { BillingComponent } from './dashboard/settings/billing/billing.component';
import { PayoutsComponent } from './dashboard/settings/payouts/payouts.component';
import { PaymentListComponent } from './dashboard/payments/payment-list/payment-list.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomerListComponent } from './dashboard/customers/customer-list/customer-list.component';
import { PlanListComponent } from './dashboard/plans/plan-list/plan-list.component';
import { SubscriberListComponent } from './dashboard/subscribers/subscriber-list/subscriber-list.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    HeaderComponent,
    PaymentsComponent,
    CustomersComponent,
    SubscribersComponent,
    PlansComponent,
    SettingsComponent,
    AccountComponent,
    BillingComponent,
    PayoutsComponent,
    PaymentListComponent,
    CustomerListComponent,
    PlanListComponent,
    SubscriberListComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, NgbModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
