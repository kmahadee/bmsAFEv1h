import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { BranchDashboardComponent } from './branch-dashboard/branch-dashboard.component';

const routes: Routes = [
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'customer-dashboard', component: CustomerDashboardComponent },
  { path: 'branch-dashboard', component: BranchDashboardComponent },

  { path: '', redirectTo: 'customer-dashboard', pathMatch: 'full' }
  // { path: '', redirectTo: '/account/list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
