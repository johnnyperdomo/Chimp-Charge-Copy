import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  //TODO: get auth state from firebase, this controls the component rendering: isLoggedIn
  isLoggedIn = false;
}
