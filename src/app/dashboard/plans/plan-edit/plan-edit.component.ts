import { Component, OnInit } from '@angular/core';
import { PlanTypeEnum } from '../plan-type.enum';
import { BillingInterval } from '../billing-interval.enum';

import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-plan-edit',
  templateUrl: './plan-edit.component.html',
  styleUrls: ['./plan-edit.component.scss'],
})
export class PlanEditComponent implements OnInit {
  planType = PlanTypeEnum.recurring;
  billingInterval = BillingInterval.monthly;

  constructor() {}

  ngOnInit(): void {}

  onSubmit(planForm: NgForm) {}

  onRecurringMode() {
    this.planType = PlanTypeEnum.recurring;
    console.log('recurring');
  }

  onOneTimeMode() {
    this.planType = PlanTypeEnum.onetime;
    console.log('onetime');
  }
}
