import { Component, Input, OnInit } from '@angular/core';
import { LOAN_TYPE_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';

@Component({
  selector: 'app-loan-summary-card',
  templateUrl: './loan-summary-card.component.html',
  styleUrls: ['./loan-summary-card.component.scss']
})
export class LoanSummaryCardComponent implements OnInit {
  @Input() loan!: LoanResponse;
  @Input() showFullDetails: boolean = true;

  totalPaid: number = 0;
  repaymentProgress: number = 0;

  constructor() { }

  ngOnInit(): void {
    this.calculateSummary();
  }

  calculateSummary(): void {
    this.totalPaid = this.loan.principal - this.loan.outstandingBalance;
    this.repaymentProgress = LoanHelpers.calculateProgress(
      this.totalPaid,
      this.loan.principal
    );
  }

  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  formatLoanType(type: string): string {
    return LOAN_TYPE_LABELS[type] || type;
  }

  getLoanStatusBadgeClass(): string {
    return LoanHelpers.getLoanStatusBadgeClass(this.loan.loanStatus);
  }

  getProgressBarClass(): string {
    if (this.repaymentProgress >= 75) return 'bg-success';
    if (this.repaymentProgress >= 50) return 'bg-info';
    if (this.repaymentProgress >= 25) return 'bg-warning';
    return 'bg-danger';
  }

  getRiskRatingClass(): string {
    return LoanHelpers.getRiskRatingColor(this.loan.eligibilityStatus || 'MODERATE');
  }
}
