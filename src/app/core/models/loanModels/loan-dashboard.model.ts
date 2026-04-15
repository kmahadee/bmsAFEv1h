export interface DashboardStatistics {
  totalLoans: number;
  pendingApprovals: number;
  activeLoans: number;
  closedLoans: number;
  defaultedLoans: number;
  totalPrincipal: number;
  totalOutstanding: number;
  totalDisbursed: number;
  monthlyEMICollection: number;
}

export interface LoanTypeDistribution {
  type: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface RecentActivity {
  loanId: string;
  customerName: string;
  activity: string;
  date: string;
  amount?: number;
}