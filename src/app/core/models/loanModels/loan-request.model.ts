// ==================== Loan Request Models ====================

import { LoanType, ApplicantType, EmploymentType, PaymentMode, LoanStatus } from "./loan-enums.model";

export interface LoanApplicationRequest {
  customerId: string;
  loanType: LoanType;
  loanAmount: number;
  tenureMonths: number;
  annualInterestRate: number;
  accountNumber: string;
  applicantType?: ApplicantType;
  
  // Collateral info (for secured loans)
  collateralType?: string;
  collateralValue?: number;
  collateralDescription?: string;
  
  // Applicant details
  applicantName: string;
  age: number;
  monthlyIncome: number;
  employmentType: EmploymentType;
  purpose?: string;
  
  // Special fields for Import LC
  lcNumber?: string;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  lcExpiryDate?: string;
  lcAmount?: number;
  purposeOfLC?: string;
  paymentTerms?: string;
  
  // Special fields for Industrial/Working Capital
  industryType?: string;
  businessRegistrationNumber?: string;
  businessTurnover?: number;
  
  // Document list
  documentTypes?: string[];
}

export interface LoanApprovalRequest {
  loanId: string;
  approvalStatus: 'APPROVED' | 'REJECTED';
  comments?: string;
  approvalConditions?: string;
  interestRateModification?: number;
  rejectionReason?: string;
}

export interface LoanDisbursementRequest {
  loanId: string;
  disbursementAmount: number;
  accountNumber: string;
  bankDetails?: string;
  scheduledDate?: string;
}

export interface LoanRepaymentRequest {
  loanId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
}

export interface LoanForeclosureRequest {
  loanId: string;
  foreclosureDate: string;
  settlementAccountNumber: string;
}

export interface LoanSearchRequest {
  customerId?: string;
  loanStatus?: LoanStatus;
  loanType?: LoanType;
  pageNumber?: number;
  pageSize?: number;
}