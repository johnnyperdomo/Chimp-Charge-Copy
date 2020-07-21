import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  //FIX: fix ngzone outside angular error with router links in template. to replicate, reload page on any of these url under settings
}
