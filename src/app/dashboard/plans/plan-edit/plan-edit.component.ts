import { Component, OnInit } from '@angular/core';
import { PlanTypeEnum } from '../plan-type.enum';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-plan-edit',
  templateUrl: './plan-edit.component.html',
  styleUrls: ['./plan-edit.component.scss'],
})
export class PlanEditComponent implements OnInit {
  planTypeEnum = PlanTypeEnum;
  planType = PlanTypeEnum.onetime;

  constructor() {}

  ngOnInit(): void {}

  onSubmit(planForm: NgForm) {}
}
