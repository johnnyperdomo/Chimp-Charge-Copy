import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentsComponent } from './dashboard/payments/payments.component';
import { CustomersComponent } from './dashboard/customers/customers.component';
import { SubscribersComponent } from './dashboard/subscribers/subscribers.component';
import { PlansComponent } from './dashboard/plans/plans.component';
import { SettingsComponent } from './dashboard/settings/settings.component';
import { AccountComponent } from './dashboard/settings/account/account.component';
import { BillingComponent } from './dashboard/settings/billing/billing.component';
import { PayoutsComponent } from './dashboard/settings/payouts/payouts.component';

const routes: Routes = [
  //Main Navs
  { path: '', redirectTo: '/payments', pathMatch: 'full' },
  { path: 'payments', component: PaymentsComponent },
  { path: 'customers', component: CustomersComponent },
  { path: 'subscribers', component: SubscribersComponent },
  { path: 'plans', component: PlansComponent },

  //Settings
  { path: 'settings', redirectTo: 'settings/account' }, //redirects to settings/account
  {
    path: 'settings',

    component: SettingsComponent,
    children: [
      { path: 'account', component: AccountComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'payouts', component: PayoutsComponent },
    ],
  },

  //404 - Page not found
  { path: '**', redirectTo: '/payments' }, //TODO : make this a 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
