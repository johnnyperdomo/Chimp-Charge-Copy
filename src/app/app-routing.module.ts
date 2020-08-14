import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentsComponent } from './dashboard/pages/payments/transactions.component';
import { CustomersComponent } from './dashboard/pages/customers/customers.component';
import { SubscriptionsComponent } from './dashboard/pages/subscriptions/subscriptions.component';
import { PaymentLinksComponent } from './dashboard/pages/payment-links/payment-links.component';
import { SettingsComponent } from './dashboard/pages/settings/settings.component';
import { AccountComponent } from './dashboard/pages/settings/account/account.component';
import { BillingComponent } from './dashboard/pages/settings/billing/billing.component';
import { PayoutsComponent } from './dashboard/pages/settings/payouts/payouts.component';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import {
  AngularFireAuthGuard,
  redirectUnauthorizedTo,
  redirectLoggedInTo,
} from '@angular/fire/auth-guard';
import { PaymentLinkEditComponent } from './dashboard/pages/payment-links/payment-link-edit/payment-link-edit.component';
import { PaymentLinkListComponent } from './dashboard/pages/payment-links/payment-link-list/payment-link-list.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { SecurityComponent } from './dashboard/pages/settings/security/security.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';
import { CheckoutSuccessComponent } from './checkout/checkout-success/checkout-success.component';
import { ConnectRedirectComponent } from './dashboard/connect-redirect/connect-redirect.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']); //if no logged in, restrict access
const redirectLoggedInToPayments = () => redirectLoggedInTo(['payments']); //if logged in, block auth components

const routes: Routes = [
  //Auth
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectLoggedInToPayments },
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectLoggedInToPayments },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectLoggedInToPayments },
  },

  //Dashboard
  { path: '', redirectTo: '/payments', pathMatch: 'full' },

  //connect redirect used for redirecting client to stripeOAuth flow, and getting authenticated parameters
  {
    path: 'connect-redirect',
    component: ConnectRedirectComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'payments',
    component: PaymentsComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'customers',
    component: CustomersComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'payment-links',
    component: PaymentLinksComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
    children: [
      { path: '', component: PaymentLinkListComponent },
      { path: 'new', component: PaymentLinkEditComponent },
      { path: ':id/edit', component: PaymentLinkEditComponent },
    ],
  },

  //Settings
  {
    path: 'settings',
    redirectTo: 'settings/account',
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  }, //redirects to settings/account
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
    children: [
      { path: 'account', component: AccountComponent },
      { path: 'security', component: SecurityComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'payouts', component: PayoutsComponent },
    ],
  },

  //checkout - for customers, no auth required
  { path: 'pay/:id', component: CheckoutComponent },
  { path: 'pay/:id/success', component: CheckoutSuccessComponent },

  //404 - Page not found
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
