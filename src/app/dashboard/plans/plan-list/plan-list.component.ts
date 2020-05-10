import { Component, OnInit } from '@angular/core';
import { Plan } from '../plan.model';

@Component({
  selector: 'app-plan-list',
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.scss'],
})
export class PlanListComponent implements OnInit {
  plans: Plan[] = [
    new Plan('234fd4', 'Marketing Fee', 'Recurring', '$300', '11/12/20'),
    new Plan('48Rfd4', 'Logo Design', 'Single', '$175', '11/12/20'),
    new Plan('tevfd4', 'Consultation Service', 'Recurring', '$850', '11/12/20'),
  ];

  constructor() {}

  ngOnInit(): void {}
}
