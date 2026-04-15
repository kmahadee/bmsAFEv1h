import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'loanStatusBadgeClass'
})
export class LoanStatusBadgeClassPipe implements PipeTransform {

  /**
   * Get Bootstrap badge class for loan status
   * @param value - Loan status enum value
   * @param type - Status type ('loan', 'approval', 'disbursement', 'schedule')
   * @returns Bootstrap badge class string
   * 
   * Examples:
   * {{ 'ACTIVE' | loanStatusBadgeClass }} → "bg-success"
   * {{ 'PENDING' | loanStatusBadgeClass:'approval' }} → "bg-warning"
   * {{ 'DEFAULTED' | loanStatusBadgeClass }} → "bg-danger"
   * 
   * Usage in template:
   * <span class="badge" [ngClass]="loan.status | loanStatusBadgeClass">
   *   {{ loan.status | loanStatusFormat }}
   * </span>
   */
  transform(
    value: string | null | undefined,
    type: 'loan' | 'approval' | 'disbursement' | 'schedule' = 'loan'
  ): string {
    if (!value) {
      return 'bg-secondary';
    }

    const upperValue = value.toUpperCase();

    switch (type) {
      case 'loan':
        return this.getLoanStatusClass(upperValue);
      case 'approval':
        return this.getApprovalStatusClass(upperValue);
      case 'disbursement':
        return this.getDisbursementStatusClass(upperValue);
      case 'schedule':
        return this.getScheduleStatusClass(upperValue);
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get badge class for loan status
   */
  private getLoanStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'APPLICATION': 'bg-info',
      'PROCESSING': 'bg-primary',
      'APPROVED': 'bg-success',
      'ACTIVE': 'bg-success',
      'CLOSED': 'bg-secondary',
      'DEFAULTED': 'bg-danger'
    };

    return classMap[status] || 'bg-secondary';
  }

  /**
   * Get badge class for approval status
   */
  private getApprovalStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'APPROVED': 'bg-success',
      'REJECTED': 'bg-danger'
    };

    return classMap[status] || 'bg-secondary';
  }

  /**
   * Get badge class for disbursement status
   */
  private getDisbursementStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'SCHEDULED': 'bg-info',
      'COMPLETED': 'bg-success',
      'FAILED': 'bg-danger'
    };

    return classMap[status] || 'bg-secondary';
  }

  /**
   * Get badge class for repayment schedule status
   */
  private getScheduleStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'PAID': 'bg-success',
      'OVERDUE': 'bg-danger',
      'WAIVED': 'bg-secondary'
    };

    return classMap[status] || 'bg-secondary';
  }
}

