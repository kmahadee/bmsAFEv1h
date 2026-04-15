import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoanApplyComponent } from './loan-apply/loan-apply.component';
import { LoanApprovalComponent } from './admin/loan-approval/loan-approval.component';
import { LoanDisbursementComponent } from './admin/loan-disbursement/loan-disbursement.component';
import { LoanSearchComponent } from './admin/loan-search/loan-search.component';
import { PendingApprovalsComponent } from './admin/pending-approvals/pending-approvals.component';
import { LoanDetailsComponent } from './loan-details/loan-details.component';
import { LoanForecloseComponent } from './loan-foreclose/loan-foreclose.component';
import { LoanRepayComponent } from './loan-repay/loan-repay.component';
import { LoanStatementComponent } from './loan-statement/loan-statement.component';
import { MyLoansComponent } from './my-loans/my-loans.component';
import { CustomerLoansComponent } from './admin/customer-loans/customer-loans.component';
import { LoanDashboardComponent } from './admin/loan-dashboard/loan-dashboard.component';

const routes: Routes = [
  { path: 'apply', component: LoanApplyComponent },
      { path: 'my-loans', component: MyLoansComponent },
      { path: 'details/:id', component: LoanDetailsComponent },
      { path: 'statement/:id', component: LoanStatementComponent },
      { path: 'repay/:id', component: LoanRepayComponent },
      { path: 'foreclose/:id', component: LoanForecloseComponent },
      
      // Admin/Employee only routes
      { path: 'pending-approvals', component: PendingApprovalsComponent },
      { path: 'approval/:id', component: LoanApprovalComponent },
      { path: 'disburse/:id', component: LoanDisbursementComponent },
      
      // Search (typically for admin/employee)
      { path: 'search', component: LoanSearchComponent },
      { path: 'customerloans', component: CustomerLoansComponent },
      { path: 'LoanDashboard', component: LoanDashboardComponent },
      
      // Fallback or redirect
      { path: '', redirectTo: 'my-loans', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoanRoutingModule { }
