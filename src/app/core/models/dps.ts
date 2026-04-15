export interface DPS {
  id: number;
  dpsNumber: string;
  customerId: string;
  customerName: string;
  linkedAccountNumber?: string;
  branchName: string;
  monthlyInstallment: number;
  tenureMonths: number;
  interestRate: number;
  maturityAmount: number;
  totalDeposited: number;
  totalInstallmentsPaid: number;
  pendingInstallments: number;
  startDate: string;
  maturityDate: string;
  nextPaymentDate?: string;
  status: DPSStatus;
  autoDebitEnabled: boolean;
  penaltyAmount: number;
  missedInstallments: number;
  currency: string;
  nomineeFirstName?: string;
  nomineeLastName?: string;
  createdDate: string;
}

export interface DPSCreateRequest {
  customerId: string;
  linkedAccountNumber?: string;
  branchCode: string;
  monthlyInstallment: number;
  tenureMonths: number;
  interestRate: number;
  autoDebitEnabled?: boolean;
  nomineeFirstName?: string;
  nomineeLastName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;
  remarks?: string;
}

export interface DPSUpdateRequest {
  linkedAccountNumber?: string;
  autoDebitEnabled?: boolean;
  nomineeFirstName?: string;
  nomineeLastName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;
  status?: string;
  remarks?: string;
}

export interface DPSPaymentRequest {
  dpsNumber: string;
  amount: number;
  paymentMode: string;
  remarks?: string;
}

export interface DPSInstallment {
  installmentNumber: number;
  dueDate: string;
  paymentDate?: string;
  amount: number;
  penaltyAmount: number;
  status: InstallmentStatus;
  transactionId?: string;
  receiptNumber?: string;
}

export interface DPSStatement {
  dpsNumber: string;
  customerName: string;
  monthlyInstallment: number;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  totalDeposited: number;
  maturityAmount: number;
  maturityDate: string;
  installments: DPSInstallment[];
}

export interface DPSMaturityCalculation {
  monthlyInstallment: number;
  tenureMonths: number;
  interestRate: number;
  totalDeposit: number;
  interestEarned: number;
  maturityAmount: number;
}

export enum DPSStatus {
  ACTIVE = 'active',
  MATURED = 'matured',
  CLOSED = 'closed',
  DEFAULTED = 'defaulted',
  SUSPENDED = 'suspended'
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived'
}