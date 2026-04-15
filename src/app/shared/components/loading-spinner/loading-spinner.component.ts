import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent implements OnInit {
  @Input() message: string = 'Loading...';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() overlay: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  get spinnerClass(): string {
    const sizeClass = this.size === 'sm' ? 'spinner-border-sm' : '';
    return `spinner-border ${sizeClass}`;
  }
}
