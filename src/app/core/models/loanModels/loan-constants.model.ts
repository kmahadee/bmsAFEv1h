// ==================== Loan Constants ====================

export class LoanConstants {
  // Eligibility criteria
  static readonly MIN_AGE = 21;
  static readonly MAX_AGE = 65;
  static readonly MIN_MONTHLY_INCOME = 1000;
  static readonly MAX_DTI_RATIO = 50; // 50%
  static readonly MIN_CREDIT_SCORE = 600;
  static readonly MAX_LTV_RATIO = 80; // 80%
  static readonly MIN_COLLATERAL_VALUE_RATIO = 120; // 120% of loan

  // Loan limits
  static readonly MIN_LOAN_AMOUNT = 50000;
  static readonly MAX_LOAN_AMOUNT = 10000000;
  static readonly MIN_TENURE_MONTHS = 6;
  static readonly MAX_TENURE_MONTHS = 360;
  static readonly MIN_INTEREST_RATE = 5;
  static readonly MAX_INTEREST_RATE = 25;

  // Penalties
  static readonly FORECLOSURE_PENALTY_RATE = 2; // 2%
  static readonly PENALTY_RATE_PER_DAY = 0.05; // 0.05% per day
  static readonly MAX_OVERDUE_DAYS = 90;
}

export const LOAN_TYPE_LABELS: { [key: string]: string } = {
  HOME_LOAN: 'Home Loan',
  CAR_LOAN: 'Car Loan',
  PERSONAL_LOAN: 'Personal Loan',
  EDUCATION_LOAN: 'Education Loan',
  BUSINESS_LOAN: 'Business Loan',
  GOLD_LOAN: 'Gold Loan',
  INDUSTRIAL_LOAN: 'Industrial Loan',
  IMPORT_LC_LOAN: 'Import LC Loan',
  WORKING_CAPITAL_LOAN: 'Working Capital Loan'
};

export const LOAN_STATUS_LABELS: { [key: string]: string } = {
  APPLICATION: 'Application',
  PROCESSING: 'Processing',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  DEFAULTED: 'Defaulted'
};

export const APPROVAL_STATUS_LABELS: { [key: string]: string } = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const DISBURSEMENT_STATUS_LABELS: { [key: string]: string } = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

export const SCHEDULE_STATUS_LABELS: { [key: string]: string } = {
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  WAIVED: 'Waived'
};

export const EMPLOYMENT_TYPE_LABELS: { [key: string]: string } = {
  SALARIED: 'Salaried',
  SELF_EMPLOYED: 'Self Employed',
  BUSINESS: 'Business'
};

export const PAYMENT_MODE_LABELS: { [key: string]: string } = {
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
  IMPS: 'IMPS',
  UPI: 'UPI'
};