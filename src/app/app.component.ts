import { Component, OnInit } from '@angular/core';
import * as fromApp from './shared/app-store/app.reducer';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth/store/auth.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit() {
    this.autoLoginUser();
  }

  autoLoginUser() {
    this.store.dispatch(new AuthActions.AutoLogin());
  }
}

//LATER: see where you can replace certain components, using angular material components, like loading spinners, dialogs, etc.... way easier, and faster
//LATER: make all 'lists' text wrapper for long texts, to make it response

//LATER: fix firebase query reads; make sure app doesn't query on each component load, but does so one time, and can also from ngrx store to load this instead on the component. Maybee load a limited amount of most recent data once on initial app.comp.ts load, and then only fetch new data on pagination change, or on individual snapshot changes. i.e, limit => 10 of the most recent transactions.(don't want to get unnecesary needs user won't read)

//LATER: add pagination controls on front end, so don't present too much data to user which becomes overwhelming. Get all data first from server, manipuulate on client side

//LATER: work on making app responsive on different screen sizes.

//LATER: create reducers for all components, for better, single one source of truth

//LATER: get all ngoninit observables and add them in a separate function to make code cleaner

//LATER: listen for angFire auth state changes, if auth state logs out, call logout ngrx action. right now, if auth state changes, logout may not be called sometimes. (to replicate: when logged into app on computer, delet user on firebase console => auth state changes, but client side logout is not detected )

//FIX: for forms - user can either click button(best way) or they might click enter on the keyboard, make sure we test for that edge case.

//FIX: most try catch blocks should return something in the try block, or throw an error of some sort, only if necessary like if a cloud function or something, or expecting a value. i.e. most buttons won't need one
