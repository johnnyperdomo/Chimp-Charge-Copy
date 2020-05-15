import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  //TODO: get auth state from firebase, this controls the component rendering: isLoggedIn
  isLoggedIn = false;
  afAuthSub: Subscription;

  constructor(private afAuth: AngularFireAuth) {}

  ngOnInit() {
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        this.isLoggedIn = true;
        console.log('logged in true');
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.afAuthSub) {
      this.afAuthSub.unsubscribe();
    }
  }
}
