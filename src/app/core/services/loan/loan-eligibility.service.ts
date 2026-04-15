import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EligibilityCheckResult } from '../../models/loanModels/EligibilityCheckResult.model';
import { AuthService } from '../auth.service';
import { LoanCalculationService } from './loan-calculation.service';
import { LoanService } from './loan.service';

@Injectable({
  providedIn: 'root'
})
export class LoanEligibilityService {

  // Eligibility criteria constants
  private readonly MIN_AGE = 21;
  private readonly MAX_AGE = 65;
  private readonly MIN_MONTHLY_INCOME = 1000;
  private readonly MAX_DTI_RATIO = 50; // 50%
  private readonly MIN_CREDIT_SCORE = 600;
  private readonly MAX_LTV_RATIO = 80; // 80%
  private readonly MIN_COLLATERAL_VALUE_RATIO = 120; // 120% of loan

  constructor(
    private calculationService: LoanCalculationService,
    private loanService: LoanService,
    private authService: AuthService
  ) { }

  /**
   * Quick eligibility check (client-side validation)
   */
  checkEligibilityQuick(
    loanAmount: number,
    monthlyIncome: number,
    age: number,
    existingEMI: number,
    tenureMonths: number,
    annualInterestRate: number,
    collateralValue?: number,
    loanType?: string
  ): EligibilityCheckResult {
    const reasons: string[] = [];
    let eligibilityScore = 100;

    // Validate age
    if (age < this.MIN_AGE || age > this.MAX_AGE) {
      reasons.push(`Age must be between ${this.MIN_AGE} and ${this.MAX_AGE} years`);
      eligibilityScore -= 25;
    }

    // Validate monthly income
    if (monthlyIncome < this.MIN_MONTHLY_INCOME) {
      reasons.push(`Minimum monthly income required: ${this.MIN_MONTHLY_INCOME}`);
      eligibilityScore -= 20;
    }

    // Calculate proposed EMI
    const proposedEMI = this.calculationService.calculateEMI(
      loanAmount,
      annualInterestRate,
      tenureMonths
    );

    // Calculate DTI ratio
    const totalEMI = existingEMI + proposedEMI;
    const dtiRatio = this.calculationService.calculateDTI(totalEMI, monthlyIncome);

    if (dtiRatio > this.MAX_DTI_RATIO) {
      reasons.push(
        `Debt-to-Income ratio (${dtiRatio.toFixed(2)}%) exceeds maximum allowed (${this.MAX_DTI_RATIO}%)`
      );
      eligibilityScore -= 30;
    }

    // Check collateral for secured loans
    let ltvRatio = 0;
    if (this.isSecuredLoanType(loanType)) {
      if (!collateralValue || collateralValue <= 0) {
        reasons.push('Collateral is required for this loan type');
        eligibilityScore -= 40;
      } else {
        ltvRatio = this.calculationService.calculateLTV(loanAmount, collateralValue);

        if (ltvRatio > this.MAX_LTV_RATIO) {
          reasons.push(
            `Loan-to-Value ratio (${ltvRatio.toFixed(2)}%) exceeds maximum (${this.MAX_LTV_RATIO}%)`
          );
          eligibilityScore -= 25;
        }

        const collateralRatio = (collateralValue / loanAmount) * 100;
        if (collateralRatio < this.MIN_COLLATERAL_VALUE_RATIO) {
          reasons.push(
            `Collateral value must be at least ${this.MIN_COLLATERAL_VALUE_RATIO}% of loan amount`
          );
          eligibilityScore -= 20;
        }
      }
    }

    // Ensure score doesn't go below 0
    eligibilityScore = Math.max(0, eligibilityScore);

    // Calculate recommended values
    const recommendedAmount = this.calculateRecommendedAmount(
      monthlyIncome,
      existingEMI,
      tenureMonths,
      annualInterestRate
    );

    const recommendedRate = this.calculateRecommendedRate(eligibilityScore);
    const riskRating = this.calculateRiskRating(eligibilityScore);
    const maxEMI = this.calculateMaxEMI(monthlyIncome, existingEMI);

    return {
      isEligible: eligibilityScore >= 70 && reasons.length === 0,
      eligibilityScore,
      reasons,
      recommendedLoanAmount: recommendedAmount,
      recommendedInterestRate: recommendedRate,
      riskRating,
      dtiRatio,
      ltvRatio: ltvRatio > 0 ? ltvRatio : undefined,
      maxEMI
    };
  }

  /**
   * Get existing EMI for customer
   */
  getExistingEMI(): Observable<number> {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      return new Observable(observer => {
        observer.next(0);
        observer.complete();
      });
    }

    return this.loanService.getMyLoans().pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data
            .filter(loan => loan.loanStatus === 'ACTIVE')
            .reduce((sum, loan) => sum + loan.monthlyEMI, 0);
        }
        return 0;
      })
    );
  }

  /**
   * Check if loan type requires collateral
   */
  isSecuredLoanType(loanType?: string): boolean {
    if (!loanType) return false;
    
    const securedTypes = [
      'HOME_LOAN',
      'CAR_LOAN',
      'GOLD_LOAN',
      'INDUSTRIAL_LOAN'
    ];
    
    return securedTypes.includes(loanType.toUpperCase());
  }

  /**
   * Calculate recommended loan amount based on income
   */
  private calculateRecommendedAmount(
    monthlyIncome: number,
    existingEMI: number,
    tenureMonths: number,
    annualRate: number
  ): number {
    // Maximum EMI allowed (40% of income for conservative approach)
    const maxAllowedEMI = (monthlyIncome * 0.40) - existingEMI;

    if (maxAllowedEMI <= 0) {
      return 0;
    }

    // Calculate loan amount for this EMI
    const monthlyRate = annualRate / 1200;
    const onePlusRate = 1 + monthlyRate;
    const power = Math.pow(onePlusRate, tenureMonths);
    const denominator = monthlyRate * power;
    const numerator = power - 1;

    const recommendedAmount = (maxAllowedEMI * numerator) / denominator;

    return Math.round(recommendedAmount * 100) / 100;
  }

  /**
   * Calculate recommended interest rate based on eligibility score
   */
  private calculateRecommendedRate(eligibilityScore: number): number {
    if (eligibilityScore >= 90) {
      return 7.50;
    } else if (eligibilityScore >= 80) {
      return 8.50;
    } else if (eligibilityScore >= 70) {
      return 9.50;
    } else {
      return 11.50;
    }
  }

  /**
   * Calculate risk rating based on eligibility score
   */
  private calculateRiskRating(eligibilityScore: number): string {
    if (eligibilityScore >= 90) {
      return 'LOW';
    } else if (eligibilityScore >= 75) {
      return 'MODERATE';
    } else if (eligibilityScore >= 60) {
      return 'HIGH';
    } else {
      return 'VERY_HIGH';
    }
  }

  /**
   * Calculate maximum EMI based on income
   */
  private calculateMaxEMI(monthlyIncome: number, existingEMI: number): number {
    return Math.round(((monthlyIncome * 0.40) - existingEMI) * 100) / 100;
  }

  /**
   * Get risk rating badge class
   */
  getRiskRatingClass(riskRating: string): string {
    switch (riskRating.toUpperCase()) {
      case 'LOW':
        return 'bg-success';
      case 'MODERATE':
        return 'bg-warning';
      case 'HIGH':
        return 'bg-danger';
      case 'VERY_HIGH':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get eligibility score badge class
   */
  getEligibilityScoreClass(score: number): string {
    if (score >= 90) {
      return 'bg-success';
    } else if (score >= 75) {
      return 'bg-info';
    } else if (score >= 60) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }
}
