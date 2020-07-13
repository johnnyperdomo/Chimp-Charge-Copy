import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class PaymentsComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  onViewPayouts() {
    this.router.navigate(['settings/payouts']);
  }
}
