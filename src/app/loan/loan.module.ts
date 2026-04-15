import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoanRoutingModule } from './loan-routing.module';
import { EmiCalculatorComponent } from '../shared/components/loan/emi-calculator/emi-calculator.component';
import { LoanCardComponent } from '../shared/components/loan/loan-card/loan-card.component';
import { LoanFilterComponent } from '../shared/components/loan/loan-filter/loan-filter.component';
import { LoanStatusBadgeComponent } from '../shared/components/loan/loan-status-badge/loan-status-badge.component';
import { LoanSummaryCardComponent } from '../shared/components/loan/loan-summary-card/loan-summary-card.component';
import { LoanTimelineComponent } from '../shared/components/loan/loan-timeline/loan-timeline.component';
import { RepaymentScheduleTableComponent } from '../shared/components/loan/repayment-schedule-table/repayment-schedule-table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoanApplyComponent } from './loan-apply/loan-apply.component';
import { MyLoansComponent } from './my-loans/my-loans.component';
import { LoanDetailsComponent } from './loan-details/loan-details.component';
import { LoanStatementComponent } from './loan-statement/loan-statement.component';
import { LoanRepayComponent } from './loan-repay/loan-repay.component';
import { LoanForecloseComponent } from './loan-foreclose/loan-foreclose.component';
import { PendingApprovalsComponent } from './admin/pending-approvals/pending-approvals.component';
import { LoanApprovalComponent } from './admin/loan-approval/loan-approval.component';
import { LoanDisbursementComponent } from './admin/loan-disbursement/loan-disbursement.component';
import { LoanSearchComponent } from './admin/loan-search/loan-search.component';
import { CustomerLoansComponent } from './admin/customer-loans/customer-loans.component';
import { LoanDashboardComponent } from './admin/loan-dashboard/loan-dashboard.component';



@NgModule({
  declarations: [




        
  
    LoanApplyComponent,
                    MyLoansComponent,
                    LoanDetailsComponent,
                    LoanStatementComponent,
                    LoanRepayComponent,
                    LoanForecloseComponent,
                    PendingApprovalsComponent,
                    LoanApprovalComponent,
                    LoanDisbursementComponent,
                    LoanSearchComponent,
                    CustomerLoansComponent,
                    LoanDashboardComponent
  ],
  imports: [
    CommonModule,
    LoanRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    
  ]
})
export class LoanModule { }
