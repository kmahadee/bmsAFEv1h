// ==================== Loan Response Models ====================

export interface LoanResponse {
  loanId: string;
  loanType: string;
  loanStatus: string;
  approvalStatus: string;
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  totalAmount: number;
  totalInterest: number;
  outstandingBalance: number;
  disbursedAmount: number;
  approvedAmount: number;
  creditScore?: number;
  eligibilityStatus?: string;
  applicationDate: string;
  approvedDate?: string;
  actualDisbursementDate?: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  collateralType?: string;
  collateralValue?: number;
  purpose?: string;
  approvalConditions?: string;
  createdDate: string;
  disbursementStatus: string;
  
  // Special fields
  lcNumber?: string;
  beneficiaryName?: string;
  industryType?: string;
  businessTurnover?: number;
}

export interface LoanListItem {
  loanId: string;
  loanType: string;
  loanStatus: string;
  approvalStatus: string;
  principal: number;
  outstandingBalance: number;
  monthlyEMI: number;
  applicationDate: string;
  customerName: string;
  customerId: string;
}

export interface LoanSearchResponse {
  loans: LoanListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface LoanEligibilityResponse {
  isEligible: boolean;
  eligibilityScore: number;
  reasons: string[];
  recommendedLoanAmount: number;
  recommendedInterestRate: number;
  nextReviewDate: string;
  riskRating: string;
}