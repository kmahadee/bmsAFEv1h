import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';

@Component({
  selector: 'app-loan-card',
  templateUrl: './loan-card.component.html',
  styleUrls: ['./loan-card.component.scss']
})
export class LoanCardComponent {
  @Input() loan!: LoanListItem;
  @Input() showActions: boolean = true;
  @Input() showCustomerInfo: boolean = false;
  
  @Output() viewDetails = new EventEmitter<string>();
  @Output() makePayment = new EventEmitter<string>();
  @Output() viewStatement = new EventEmitter<string>();

  constructor() { }

  onViewDetails(): void {
    this.viewDetails.emit(this.loan.loanId);
  }

  onMakePayment(): void {
    this.makePayment.emit(this.loan.loanId);
  }

  onViewStatement(): void {
    this.viewStatement.emit(this.loan.loanId);
  }

  getLoanTypeBadgeClass(): string {
    return 'bg-info';
  }

  getLoanStatusBadgeClass(): string {
    return LoanHelpers.getLoanStatusBadgeClass(this.loan.loanStatus);
  }

  getApprovalStatusBadgeClass(): string {
    return LoanHelpers.getApprovalStatusBadgeClass(this.loan.approvalStatus);
  }

  formatLoanType(type: string): string {
    return LOAN_TYPE_LABELS[type] || type;
  }

  formatLoanStatus(status: string): string {
    return LOAN_STATUS_LABELS[status] || status;
  }

  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  calculateProgress(): number {
    if (!this.loan.principal || this.loan.principal === 0) return 0;
    const paid = this.loan.principal - this.loan.outstandingBalance;
    return LoanHelpers.calculateProgress(paid, this.loan.principal);
  }

  getProgressBarClass(): string {
    const progress = this.calculateProgress();
    if (progress >= 75) return 'bg-success';
    if (progress >= 50) return 'bg-info';
    if (progress >= 25) return 'bg-warning';
    return 'bg-danger';
  }

  canMakePayment(): boolean {
    return this.loan.loanStatus === 'ACTIVE' && this.loan.outstandingBalance > 0;
  }
}
