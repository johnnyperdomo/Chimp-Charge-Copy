import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class PaymentsComponent implements OnInit {
  constructor(private router: Router, private zone: NgZone) {}

  ngOnInit(): void {}

  onViewPayouts() {
    this.zone.run(() => {
      this.router.navigate(['settings/payouts']);
    });
  }
}
