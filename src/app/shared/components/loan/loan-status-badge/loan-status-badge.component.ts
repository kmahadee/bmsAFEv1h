import { Component, Input } from '@angular/core';
import { LOAN_STATUS_LABELS, APPROVAL_STATUS_LABELS, DISBURSEMENT_STATUS_LABELS, SCHEDULE_STATUS_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';

@Component({
  selector: 'app-loan-status-badge',
  templateUrl: './loan-status-badge.component.html',
  styleUrls: ['./loan-status-badge.component.scss']
})
export class LoanStatusBadgeComponent {
  @Input() status!: string;
  @Input() type: 'loan' | 'approval' | 'disbursement' | 'schedule' = 'loan';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showIcon: boolean = true;

  constructor() { }

  getBadgeClass(): string {
    let baseClass = 'badge';
    
    // Add size class
    if (this.size === 'sm') {
      baseClass += ' badge-sm';
    } else if (this.size === 'lg') {
      baseClass += ' badge-lg';
    }

    // Add color class based on type
    let colorClass = '';
    switch (this.type) {
      case 'loan':
        colorClass = LoanHelpers.getLoanStatusBadgeClass(this.status);
        break;
      case 'approval':
        colorClass = LoanHelpers.getApprovalStatusBadgeClass(this.status);
        break;
      case 'disbursement':
        colorClass = LoanHelpers.getDisbursementStatusBadgeClass(this.status);
        break;
      case 'schedule':
        colorClass = LoanHelpers.getScheduleStatusBadgeClass(this.status);
        break;
    }

    return `${baseClass} ${colorClass}`;
  }

  getStatusLabel(): string {
    switch (this.type) {
      case 'loan':
        return LOAN_STATUS_LABELS[this.status] || this.status;
      case 'approval':
        return APPROVAL_STATUS_LABELS[this.status] || this.status;
      case 'disbursement':
        return DISBURSEMENT_STATUS_LABELS[this.status] || this.status;
      case 'schedule':
        return SCHEDULE_STATUS_LABELS[this.status] || this.status;
      default:
        return this.status;
    }
  }

  getIcon(): string {
    const statusUpper = this.status?.toUpperCase();
    
    switch (this.type) {
      case 'loan':
        switch (statusUpper) {
          case 'APPLICATION': return 'bi-file-earmark-text';
          case 'PROCESSING': return 'bi-hourglass-split';
          case 'APPROVED': return 'bi-check-circle';
          case 'ACTIVE': return 'bi-check-circle-fill';
          case 'CLOSED': return 'bi-x-circle';
          case 'DEFAULTED': return 'bi-exclamation-triangle';
          default: return 'bi-circle';
        }
      
      case 'approval':
        switch (statusUpper) {
          case 'PENDING': return 'bi-clock';
          case 'APPROVED': return 'bi-check-circle-fill';
          case 'REJECTED': return 'bi-x-circle-fill';
          default: return 'bi-circle';
        }
      
      case 'disbursement':
        switch (statusUpper) {
          case 'PENDING': return 'bi-clock';
          case 'SCHEDULED': return 'bi-calendar-check';
          case 'COMPLETED': return 'bi-check-circle-fill';
          case 'FAILED': return 'bi-x-circle-fill';
          default: return 'bi-circle';
        }
      
      case 'schedule':
        switch (statusUpper) {
          case 'PENDING': return 'bi-clock';
          case 'PAID': return 'bi-check-circle-fill';
          case 'OVERDUE': return 'bi-exclamation-triangle-fill';
          case 'WAIVED': return 'bi-dash-circle';
          default: return 'bi-circle';
        }
      
      default:
        return 'bi-circle';
    }
  }
}