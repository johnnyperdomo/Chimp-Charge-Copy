import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, from } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import * as angFire from 'firebase';
import { first, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  //TODO: get auth state from firebase, this controls the component rendering: isLoggedIn
  isLoggedIn = true;
  afAuthSub: Subscription;

  constructor(private afAuth: AngularFireAuth) {}

  ngOnInit() {
    // this.afAuthSub = this.isUserLoggedin()
    //   .pipe(
    //     tap((user) => {
    //       if (user) {
    //         this.isLoggedIn = true;
    //         console.log('logged in true', user);
    //       } else {
    //         this.isLoggedIn = false;
    //       }
    //     })
    //   )
    //   .subscribe();
    // from(
    //   this.afAuth.onAuthStateChanged((user) => {
    //     if (user) {
    //     } else {
    //     }
    //   })
    // ).subscribe();
    // this.afAuth.onAuthStateChanged((user) => {
    //   if (user) {
    //     this.isLoggedIn = true;
    //     console.log('logged in true', user);
    //   } else {
    //     this.isLoggedIn = false;
    //   }
    // });
  }

  isUserLoggedin() {
    return this.afAuth.authState.pipe(first()).toPromise();
  }

  ngOnDestroy() {
    // if (this.afAuthSub) {
    //   this.afAuthSub.unsubscribe();
    // }
  }
}
