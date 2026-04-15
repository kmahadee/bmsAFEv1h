export interface EligibilityCheckResult {
  isEligible: boolean;
  eligibilityScore: number;
  reasons: string[];
  recommendedLoanAmount: number;
  recommendedInterestRate: number;
  riskRating: string;
  dtiRatio: number;
  ltvRatio?: number;
  maxEMI: number;
}
// export interface EligibilityCheckResult {}