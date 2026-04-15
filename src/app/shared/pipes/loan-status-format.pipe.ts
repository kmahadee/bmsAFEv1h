import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'loanStatusFormat'
})
export class LoanStatusFormatPipe implements PipeTransform {

  /**
   * Format loan status enum to readable text
   * @param value - Loan status enum value
   * @param type - Status type ('loan' or 'approval')
   * @returns Formatted status string
   * 
   * Examples:
   * {{ 'ACTIVE' | loanStatusFormat }} → "Active"
   * {{ 'PENDING' | loanStatusFormat:'approval' }} → "Pending Approval"
   * {{ 'DEFAULTED' | loanStatusFormat }} → "Defaulted"
   */
  transform(value: string | null | undefined, type: 'loan' | 'approval' | 'disbursement' = 'loan'): string {
    if (!value) {
      return '-';
    }

    const upperValue = value.toUpperCase();

    if (type === 'loan') {
      return this.formatLoanStatus(upperValue);
    } else if (type === 'approval') {
      return this.formatApprovalStatus(upperValue);
    } else if (type === 'disbursement') {
      return this.formatDisbursementStatus(upperValue);
    }

    return this.formatString(value);
  }

  /**
   * Format loan status
   */
  private formatLoanStatus(value: string): string {
    const statusMap: { [key: string]: string } = {
      'APPLICATION': 'Application',
      'PROCESSING': 'Processing',
      'APPROVED': 'Approved',
      'ACTIVE': 'Active',
      'CLOSED': 'Closed',
      'DEFAULTED': 'Defaulted'
    };

    return statusMap[value] || this.formatString(value);
  }

  /**
   * Format approval status
   */
  private formatApprovalStatus(value: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending Approval',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };

    return statusMap[value] || this.formatString(value);
  }

  /**
   * Format disbursement status
   */
  private formatDisbursementStatus(value: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending Disbursement',
      'SCHEDULED': 'Scheduled',
      'COMPLETED': 'Disbursed',
      'FAILED': 'Disbursement Failed'
    };

    return statusMap[value] || this.formatString(value);
  }

  /**
   * Format string by replacing underscores and capitalizing
   */
  private formatString(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

