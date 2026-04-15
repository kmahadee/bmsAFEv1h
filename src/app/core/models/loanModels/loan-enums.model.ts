// ==================== Loan Enums ====================

export enum LoanType {
  HOME_LOAN = 'HOME_LOAN',
  CAR_LOAN = 'CAR_LOAN',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  EDUCATION_LOAN = 'EDUCATION_LOAN',
  BUSINESS_LOAN = 'BUSINESS_LOAN',
  GOLD_LOAN = 'GOLD_LOAN',
  INDUSTRIAL_LOAN = 'INDUSTRIAL_LOAN',
  IMPORT_LC_LOAN = 'IMPORT_LC_LOAN',
  WORKING_CAPITAL_LOAN = 'WORKING_CAPITAL_LOAN'
}

export enum LoanStatus {
  APPLICATION = 'APPLICATION',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  DEFAULTED = 'DEFAULTED'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum DisbursementStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ScheduleStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED'
}

export enum ApplicantType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE'
}

export enum EmploymentType {
  SALARIED = 'SALARIED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  BUSINESS = 'BUSINESS'
}

export enum PaymentMode {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
  UPI = 'UPI'
}