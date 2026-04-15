// ==================== Loan Calculation Models ====================

export interface EMICalculation {
  principal: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  totalInterest: number;
  totalAmount: number;
}

export interface LoanEligibilityCalculation {
  monthlyIncome: number;
  existingEMI: number;
  proposedEMI: number;
  totalEMI: number;
  dtiRatio: number;
  maxAllowedEMI: number;
  recommendedLoanAmount: number;
}

export interface ForeclosureCalculation {
  outstandingBalance: number;
  foreclosurePenalty: number;
  totalForeclosureAmount: number;
  penaltyPercentage: number;
}

export interface LTVCalculation {
  loanAmount: number;
  collateralValue: number;
  ltvRatio: number;
  maxAllowedLTV: number;
  isWithinLimit: boolean;
}