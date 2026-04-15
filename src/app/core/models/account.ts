import { TransactionHistory } from "./transaction";

export interface Account {
  id: number;
  accountNumber: string;
  customerId: string;
  accountType: string;
  branch: string;
  balance: number;
  currency: string;
  interestRate: number;
  nomineeFirstName?: string;
  nomineeLastName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;
  status: AccountStatus;
  kycStatus: string;
  createdDate: string;
  lastUpdated: string;
  customerName: string;
  customerEmail: string;
  totalTransactions: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
}

export interface AccountListItem {
  id: number;
  accountNumber: string;
  customerId: string;
  customerName: string;
  accountType: string;
  branch: string;
  balance: number;
  currency: string;
  status: string;
  kycStatus: string;
  createdDate: string;
}



// export interface AccountCreateRequest {
//   customerId: string;
//   accountType: string;
//   branchCode: string; // Changed from 'branch' to match Swagger
//   balance: number;
//   currency: string;
//   interestRate: number;
//   nomineeFirstName?: string;
//   nomineeLastName?: string;
//   nomineeRelationship?: string;
//   nomineePhone?: string;
// }
export interface AccountCreateRequest {
  customerId: string;
  accountType: string;
  branchCode: string;
  balance: number;
  currency: string; // Must be 3-letter code: USD, BDT, EUR, etc.
  interestRate: number; // Must be <= 100
  nomineeFirstName?: string;
  nomineeLastName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string; // Must include country code with +
}




// export interface AccountCreateRequest {
//   customerId: string;
//   accountType: string;
//   branch: string;
//   balance: number;
//   currency: string;
//   interestRate: number;
//   nomineeFirstName?: string;
//   nomineeLastName?: string;
//   nomineeRelationship?: string;
//   nomineePhone?: string;
// }

export interface AccountUpdateRequest {
  branch?: string;
  interestRate?: number;
  nomineeFirstName?: string;
  nomineeLastName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;
  status?: string;
  kycStatus?: string;
}

export interface AccountBalance {
  accountNumber: string;
  customerId: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
}

export interface AccountStatement {
  accountNumber: string;
  accountType: string;
  customerName: string;
  customerEmail: string;
  branch: string;
  statementStartDate: string;
  statementEndDate: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  transactions: TransactionHistory[];
}

export interface AccountStatementRequest {
  accountNumber: string;
  startDate: string;
  endDate: string;
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
  FROZEN = 'frozen'
}












// export interface AccountCreateRequest {
//   customerId: string;
//   accountType: string;
//   branchId: number; // Changed from branch: string to branchId: number
//   balance: number;
//   currency: string;
//   interestRate: number;
//   nomineeFirstName?: string;
//   nomineeLastName?: string;
//   nomineeRelationship?: string;
//   nomineePhone?: string;
// }

export interface AccountResponse {
  id: number;
  accountNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  accountType: string;
  // Branch information
  branchId: number;
  branchCode: string;
  branchName: string;
  branchCity: string;
  branchIfscCode: string;
  balance: number;
  currency: string;
  interestRate: number;
  nomineeFirstName?: string;
  nomineeLastName?: string;
  nomineeRelationship?: string;
  nomineePhone?: string;
  status: string;
  kycStatus: string;
  createdDate: string;
  lastUpdated: string;
  totalTransactions: number;
}

export interface AccountListItem {
  id: number;
  accountNumber: string;
  customerId: string;
  customerName: string;
  accountType: string;
  // Branch information
  branchId: number;
  branchCode: string;
  branchName: string;
  balance: number;
  currency: string;
  status: string;
  kycStatus: string;
  createdDate: string;
}