// ==================== Loan Statement Models ====================

import { ScheduleStatus } from "./loan-enums.model";

export interface LoanStatementResponse {
  loanId: string;
  customerName: string;
  customerEmail: string;
  loanType: string;
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  applicationDate: string;
  disbursementDate?: string;
  totalAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  installmentsPaid: number;
  installmentsPending: number;
  nextEMIDate?: string;
  nextEMIAmount?: number;
  repaymentSchedule: RepaymentScheduleItem[];
  disbursementHistory: DisbursementHistoryItem[];
}

export interface RepaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  paymentDate?: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: ScheduleStatus;
  balanceAfterPayment: number;
  penaltyApplied: number;
}

export interface DisbursementHistoryItem {
  disbursementDate: string;
  amount: number;
  transactionId: string;
  status: string;
  reference: string;
}

export interface LoanApprovalHistoryItem {
  approvalStage: string;
  actionDate: string;
  actionByUser: string;
  decision: string;
  comments?: string;
  approvalConditions?: string;
}

export interface LoanDocumentItem {
  documentType: string;
  submissionDate: string;
  verificationDate?: string;
  status: string;
  remarks?: string;
}