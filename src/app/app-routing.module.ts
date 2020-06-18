import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentsComponent } from './dashboard/payments/payments.component';
import { CustomersComponent } from './dashboard/customers/customers.component';
import { SubscribersComponent } from './dashboard/subscribers/subscribers.component';
import { PaymentLinksComponent } from './dashboard/payment-links/payment-links.component';
import { SettingsComponent } from './dashboard/settings/settings.component';
import { AccountComponent } from './dashboard/settings/account/account.component';
import { BillingComponent } from './dashboard/settings/billing/billing.component';
import { PayoutsComponent } from './dashboard/settings/payouts/payouts.component';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import {
  AngularFireAuthGuard,
  redirectUnauthorizedTo,
  redirectLoggedInTo,
} from '@angular/fire/auth-guard';
import { PaymentLinkEditComponent } from './dashboard/payment-links/payment-link-edit/payment-link-edit.component';
import { PaymentLinkListComponent } from './dashboard/payment-links/payment-link-list/payment-link-list.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { SecurityComponent } from './dashboard/settings/security/security.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ErrorPageComponent } from './shared/error-page/error-page.component';

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
  //TODO: create forgot password to components, add auth guard

  //Dashboard
  { path: '', redirectTo: '/payments', pathMatch: 'full' },
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
    path: 'subscribers',
    component: SubscribersComponent,
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
  //TODO: if routed to this component, don't show dashboard header
  { path: 'pay/:id', component: CheckoutComponent },

  //404 - Page not found
  { path: '**', component: ErrorPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
