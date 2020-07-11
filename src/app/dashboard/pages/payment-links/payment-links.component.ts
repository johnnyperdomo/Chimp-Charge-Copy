import { Component, OnInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-links',
  templateUrl: './payment-links.component.html',
  styleUrls: ['./payment-links.component.scss'],
})
export class PaymentLinksComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {}

  onCreatePaymentLink() {
    this.zone.run(() => {
      this.router.navigate(['new'], { relativeTo: this.route });
    });
  }
}
