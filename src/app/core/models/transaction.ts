export interface Transaction {
  transactionId: string;
  referenceNumber: string;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  transferFee: number;
  serviceTax: number;
  totalAmount: number;
  transferMode: TransferMode;
  transactionType: TransactionType;
  status: TransactionStatus;
  description?: string;
  remarks?: string;
  timestamp: string;
  completedAt?: string;
  receiptNumber: string;
  balanceBefore: number;
  balanceAfter: number;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  fraudCheckPassed: boolean;
  requiresApproval: boolean;
}

export interface TransactionHistory {
  transactionId: string;
  referenceNumber: string;
  accountNumber: string;
  otherAccountNumber: string;
  transactionType: string;
  amount: number;
  transferMode: string;
  status: string;
  description?: string;
  timestamp: string;
  balanceAfter: number;
}

export interface TransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  transferMode: string;
  description?: string;
  remarks?: string;
  priority?: string;
  transferType?: string;
}

export interface DepositRequest {
  accountNumber: string;
  amount: number;
  depositMode: string;
  description?: string;
  remarks?: string;
  chequeNumber?: string;
  bankName?: string;
}

export interface WithdrawRequest {
  accountNumber: string;
  amount: number;
  withdrawalMode: string;
  description?: string;
  remarks?: string;
}

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND'
}

export enum TransferMode {
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
  UPI = 'UPI',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD'
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING'
}
