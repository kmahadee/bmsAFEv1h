import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { SharedModule } from '../shared/shared.module';
import { BranchDashboardComponent } from './branch-dashboard/branch-dashboard.component';
import { NgChartsModule } from 'ng2-charts';

// Import Chart.js and register required components
import { Chart, registerables } from 'chart.js';


@NgModule({
  declarations: [
    AdminDashboardComponent,
    CustomerDashboardComponent,
    BranchDashboardComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    NgChartsModule
  ]
})
export class DashboardModule { }
