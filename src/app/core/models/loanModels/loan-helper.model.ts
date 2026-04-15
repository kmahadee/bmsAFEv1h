// ==================== Loan Helper Functions ====================

import { LOAN_TYPE_LABELS } from "./loan-constants.model";

export class LoanHelpers {
  /**
   * Get bootstrap badge class for loan status
   */
  static getLoanStatusBadgeClass(status: string): string {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'APPROVED':
        return 'bg-success';
      case 'ACTIVE':
        return 'bg-primary';
      case 'APPLICATION':
      case 'PROCESSING':
        return 'bg-warning';
      case 'CLOSED':
        return 'bg-secondary';
      case 'DEFAULTED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get bootstrap badge class for approval status
   */
  static getApprovalStatusBadgeClass(status: string): string {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'APPROVED':
        return 'bg-success';
      case 'PENDING':
        return 'bg-warning';
      case 'REJECTED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get bootstrap badge class for disbursement status
   */
  static getDisbursementStatusBadgeClass(status: string): string {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'COMPLETED':
        return 'bg-success';
      case 'SCHEDULED':
        return 'bg-info';
      case 'PENDING':
        return 'bg-warning';
      case 'FAILED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get bootstrap badge class for schedule status
   */
  static getScheduleStatusBadgeClass(status: string): string {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAID':
        return 'bg-success';
      case 'PENDING':
        return 'bg-warning';
      case 'OVERDUE':
        return 'bg-danger';
      case 'WAIVED':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Check if loan type requires collateral
   */
  static isSecuredLoanType(loanType: string): boolean {
    const securedTypes = [
      'HOME_LOAN',
      'CAR_LOAN',
      'GOLD_LOAN',
      'INDUSTRIAL_LOAN'
    ];
    return securedTypes.includes(loanType?.toUpperCase());
  }

  /**
   * Format loan type for display
   */
  static formatLoanType(loanType: string): string {
    return LOAN_TYPE_LABELS[loanType?.toUpperCase()] || loanType;
  }

  /**
   * Format loan amount with currency
   */
  static formatAmount(amount: number, currency: string = 'BDT'): string {
    if (!amount) return `${currency} 0.00`;
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Calculate progress percentage
   */
  static calculateProgress(paid: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((paid / total) * 100);
  }

  /**
   * Get risk rating color
   */
  static getRiskRatingColor(rating: string): string {
    const ratingUpper = rating?.toUpperCase();
    switch (ratingUpper) {
      case 'LOW':
        return 'success';
      case 'MODERATE':
        return 'info';
      case 'HIGH':
        return 'warning';
      case 'VERY_HIGH':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}