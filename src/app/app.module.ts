import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './dashboard/header/header.component';
import { PaymentsComponent } from './dashboard/payments/payments.component';
import { CustomersComponent } from './dashboard/customers/customers.component';
import { SubscribersComponent } from './dashboard/subscribers/subscribers.component';
import { PaymentLinksComponent } from './dashboard/payment-links/payment-links.component';
import { SettingsComponent } from './dashboard/settings/settings.component';
import { AccountComponent } from './dashboard/settings/account/account.component';
import { BillingComponent } from './dashboard/settings/billing/billing.component';
import { PayoutsComponent } from './dashboard/settings/payouts/payouts.component';
import { PaymentListComponent } from './dashboard/payments/payment-list/payment-list.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomerListComponent } from './dashboard/customers/customer-list/customer-list.component';
import { PaymentLinkListComponent } from './dashboard/payment-links/payment-link-list/payment-link-list.component';
import { SubscriberListComponent } from './dashboard/subscribers/subscriber-list/subscriber-list.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthComponent } from './auth/auth.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from '../environments/environment';

import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import * as fromApp from './store/app.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AuthEffects } from './auth/store/auth.effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';

import * as firebase from 'firebase/app';
import { MerchantEffects } from './merchants/store/merchant.effects';
import { PaymentLinkEditComponent } from './dashboard/payment-links/payment-link-edit/payment-link-edit.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { SecurityComponent } from './dashboard/settings/security/security.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';
firebase.initializeApp(environment.firebase);

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    HeaderComponent,
    PaymentsComponent,
    CustomersComponent,
    SubscribersComponent,
    PaymentLinksComponent,
    SettingsComponent,
    AccountComponent,
    BillingComponent,
    PayoutsComponent,
    PaymentListComponent,
    CustomerListComponent,
    PaymentLinkListComponent,
    SubscriberListComponent,
    SignUpComponent,
    LoginComponent,
    AuthComponent,
    PaymentLinkEditComponent,
    CheckoutComponent,
    SecurityComponent,
    ForgotPasswordComponent,
    PageNotFoundComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ClipboardModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireFunctionsModule,
    StoreModule.forRoot(fromApp.appReducer),
    StoreDevtoolsModule.instrument({ logOnly: environment.production }),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([AuthEffects, MerchantEffects]),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
