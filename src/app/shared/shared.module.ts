import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { PercentageFormatPipe } from './pipes/percentage-format.pipe';
import { LoanTypeFormatPipe } from './pipes/loan-type-format.pipe';
import { LoanStatusFormatPipe } from './pipes/loan-status-format.pipe';
import { LoanStatusBadgeClassPipe } from './pipes/loan-status-badge-class.pipe';
import { LoanCardComponent } from './components/loan/loan-card/loan-card.component';
import { EmiCalculatorComponent } from './components/loan/emi-calculator/emi-calculator.component';
import { LoanStatusBadgeComponent } from './components/loan/loan-status-badge/loan-status-badge.component';
import { LoanTimelineComponent } from './components/loan/loan-timeline/loan-timeline.component';
import { RepaymentScheduleTableComponent } from './components/loan/repayment-schedule-table/repayment-schedule-table.component';
import { LoanSummaryCardComponent } from './components/loan/loan-summary-card/loan-summary-card.component';
import { LoanFilterComponent } from './components/loan/loan-filter/loan-filter.component';

@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
    PercentageFormatPipe,
    LoanTypeFormatPipe,
    LoanStatusFormatPipe,
    LoanStatusBadgeClassPipe,

        LoanCardComponent,
        EmiCalculatorComponent,
        LoanStatusBadgeComponent,
        LoanTimelineComponent,
        RepaymentScheduleTableComponent,
        LoanSummaryCardComponent,
        LoanFilterComponent
    
    
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    CommonModule,
    LoadingSpinnerComponent,

    
    CurrencyFormatPipe,
    DateFormatPipe,
    PercentageFormatPipe,
    LoanTypeFormatPipe,
    LoanStatusFormatPipe,
    LoanStatusBadgeClassPipe,

    LoanCardComponent,
    EmiCalculatorComponent,
    LoanStatusBadgeComponent,
    LoanTimelineComponent,
    RepaymentScheduleTableComponent,
    LoanSummaryCardComponent,
    LoanFilterComponent
  ]
})
export class SharedModule { }
