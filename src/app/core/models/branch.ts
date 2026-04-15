export interface Branch {
  id: number;
  branchCode: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  ifscCode: string;
  swiftCode?: string;
  status: BranchStatus;
  workingHours?: string;
  isMainBranch: boolean;
  createdDate: string;
  lastUpdated: string;
  totalAccounts: number;
  totalDPS: number;
  totalEmployees: number;
}

export interface BranchCreateRequest {
  branchName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  ifscCode: string;
  swiftCode?: string;
  workingHours?: string;
  isMainBranch?: boolean;
}

export interface BranchUpdateRequest {
  branchName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  workingHours?: string;
  status?: string;
}

export enum BranchStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_MAINTENANCE = 'under_maintenance'
}










/**
 * Statistics for a single branch
 */
export interface BranchStatistics {
  branchId: number;
  branchCode: string;
  branchName: string;
  city: string;
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  averageBalance: number;
}

/**
 * Overall bank statistics across all branches
 */
export interface BankStatistics {
  totalBranches: number;
  activeBranches: number;
  totalAccounts: number;
  activeAccounts: number;
  totalBankBalance: number;
  averageBalancePerAccount: number;
  branchStatistics: BranchStatistics[];
}

/**
 * API Response wrapper for BranchStatistics
 */
export interface BranchStatisticsResponse {
  success: boolean;
  message: string;
  data: BranchStatistics;
  timestamp: string;
}

/**
 * API Response wrapper for BankStatistics
 */
export interface BankStatisticsResponse {
  success: boolean;
  message: string;
  data: BankStatistics;
  timestamp: string;
}