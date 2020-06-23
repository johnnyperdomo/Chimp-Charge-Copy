import { Component, OnInit } from '@angular/core';
import * as fromApp from '../../shared/app-store/app.reducer';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../auth/store/auth.actions';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit(): void {}

  onSignOut() {
    //FUTURE-UPDATE, add a 'successfully logged out alert'
    this.store.dispatch(new AuthActions.Logout());
  }
}
