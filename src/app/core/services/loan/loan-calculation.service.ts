import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class  LoanCalculationService {

  constructor() { }

  /**
   * Calculate EMI using reduce-balance method
   * Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
   */
  calculateEMI(principal: number, annualRate: number, months: number): number {
    if (principal <= 0 || annualRate <= 0 || months <= 0) {
      throw new Error('All parameters must be positive numbers');
    }

    // Convert annual rate to monthly rate (percentage to decimal)
    const monthlyRate = annualRate / 1200;

    // Calculate (1 + r)
    const onePlusRate = 1 + monthlyRate;

    // Calculate (1 + r)^n
    const power = Math.pow(onePlusRate, months);

    // Calculate EMI
    const emi = (principal * monthlyRate * power) / (power - 1);

    return Math.round(emi * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate total interest
   */
  calculateTotalInterest(emi: number, months: number, principal: number): number {
    const totalAmount = emi * months;
    return Math.round((totalAmount - principal) * 100) / 100;
  }

  /**
   * Calculate total amount (principal + interest)
   */
  calculateTotalAmount(emi: number, months: number): number {
    return Math.round(emi * months * 100) / 100;
  }

  /**
   * Calculate interest for a specific period
   */
  calculatePeriodInterest(outstandingBalance: number, annualRate: number): number {
    const monthlyRate = annualRate / 1200;
    return Math.round(outstandingBalance * monthlyRate * 100) / 100;
  }

  /**
   * Calculate principal for a specific period
   */
  calculatePeriodPrincipal(emi: number, periodInterest: number): number {
    return Math.round((emi - periodInterest) * 100) / 100;
  }

  /**
   * Calculate prepayment charges
   */
  calculatePrepaymentCharges(outstandingBalance: number, chargePercentage: number): number {
    return Math.round((outstandingBalance * chargePercentage / 100) * 100) / 100;
  }

  /**
   * Calculate late payment penalty
   */
  calculateLatePenalty(overdueAmount: number, penaltyRate: number, daysOverdue: number): number {
    // Penalty = Overdue Amount × Penalty Rate × (Days / 30)
    const monthlyPenalty = (overdueAmount * penaltyRate) / 100;
    const dailyPenalty = monthlyPenalty / 30;
    return Math.round(dailyPenalty * daysOverdue * 100) / 100;
  }

  /**
   * Calculate outstanding balance after payment
   */
  calculateOutstandingAfterPayment(currentOutstanding: number, principalPaid: number): number {
    return Math.round((currentOutstanding - principalPaid) * 100) / 100;
  }

  /**
   * Calculate Loan-to-Value (LTV) ratio
   */
  calculateLTV(loanAmount: number, collateralValue: number): number {
    if (collateralValue === 0) {
      return 0;
    }
    return Math.round((loanAmount / collateralValue) * 10000) / 100; // Percentage with 2 decimals
  }

  /**
   * Calculate Debt-to-Income (DTI) ratio
   */
  calculateDTI(totalEMI: number, monthlyIncome: number): number {
    if (monthlyIncome === 0) {
      return 100;
    }
    return Math.round((totalEMI / monthlyIncome) * 10000) / 100; // Percentage with 2 decimals
  }

  /**
   * Generate amortization schedule
   */
  generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    months: number
  ): Array<{
    installmentNumber: number;
    emi: number;
    principalAmount: number;
    interestAmount: number;
    outstandingBalance: number;
  }> {
    const emi = this.calculateEMI(principal, annualRate, months);
    const schedule = [];
    let outstandingBalance = principal;

    for (let i = 1; i <= months; i++) {
      const interestAmount = this.calculatePeriodInterest(outstandingBalance, annualRate);
      const principalAmount = this.calculatePeriodPrincipal(emi, interestAmount);
      
      outstandingBalance = this.calculateOutstandingAfterPayment(outstandingBalance, principalAmount);
      
      // Handle final installment rounding
      if (i === months && outstandingBalance < 0) {
        outstandingBalance = 0;
      }

      schedule.push({
        installmentNumber: i,
        emi: emi,
        principalAmount: principalAmount,
        interestAmount: interestAmount,
        outstandingBalance: outstandingBalance
      });
    }

    return schedule;
  }

  /**
   * Calculate foreclosure amount
   */
  calculateForeclosureAmount(outstandingBalance: number, penaltyPercentage: number): {
    outstandingBalance: number;
    penalty: number;
    totalAmount: number;
  } {
    const penalty = this.calculatePrepaymentCharges(outstandingBalance, penaltyPercentage);
    const totalAmount = outstandingBalance + penalty;

    return {
      outstandingBalance: outstandingBalance,
      penalty: penalty,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}















  // export class LoanCalculationService {

//   constructor() { }

//   /**
//    * Calculate EMI using reduce-balance method
//    * Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
//    */
//   calculateEMI(principal: number, annualRate: number, months: number): number {
//     if (principal <= 0 || annualRate <= 0 || months <= 0) {
//       throw new Error('All parameters must be positive numbers');
//     }

//     // Convert annual rate to monthly rate (percentage to decimal)
//     const monthlyRate = annualRate / 1200;

//     // Calculate (1 + r)
//     const onePlusRate = 1 + monthlyRate;

//     // Calculate (1 + r)^n
//     const power = Math.pow(onePlusRate, months);

//     // Calculate EMI
//     const emi = (principal * monthlyRate * power) / (power - 1);

//     return Math.round(emi * 100) / 100; // Round to 2 decimal places
//   }

//   /**
//    * Calculate total interest
//    */
//   calculateTotalInterest(emi: number, months: number, principal: number): number {
//     const totalAmount = emi * months;
//     return Math.round((totalAmount - principal) * 100) / 100;
//   }

//   /**
//    * Calculate total amount (principal + interest)
//    */
//   calculateTotalAmount(emi: number, months: number): number {
//     return Math.round(emi * months * 100) / 100;
//   }

//   /**
//    * Calculate interest for a specific period
//    */
//   calculatePeriodInterest(outstandingBalance: number, annualRate: number): number {
//     const monthlyRate = annualRate / 1200;
//     return Math.round(outstandingBalance * monthlyRate * 100) / 100;
//   }

//   /**
//    * Calculate principal for a specific period
//    */
//   calculatePeriodPrincipal(emi: number, periodInterest: number): number {
//     return Math.round((emi - periodInterest) * 100) / 100;
//   }

//   /**
//    * Calculate prepayment charges
//    */
//   calculatePrepaymentCharges(outstandingBalance: number, chargePercentage: number): number {
//     return Math.round((outstandingBalance * chargePercentage / 100) * 100) / 100;
//   }

//   /**
//    * Calculate late payment penalty
//    */
//   calculateLatePenalty(overdueAmount: number, penaltyRate: number, daysOverdue: number): number {
//     // Penalty = Overdue Amount × Penalty Rate × (Days / 30)
//     const monthlyPenalty = (overdueAmount * penaltyRate) / 100;
//     const dailyPenalty = monthlyPenalty / 30;
//     return Math.round(dailyPenalty * daysOverdue * 100) / 100;
//   }

//   /**
//    * Calculate outstanding balance after payment
//    */
//   calculateOutstandingAfterPayment(currentOutstanding: number, principalPaid: number): number {
//     return Math.round((currentOutstanding - principalPaid) * 100) / 100;
//   }

//   /**
//    * Calculate Loan-to-Value (LTV) ratio
//    */
//   calculateLTV(loanAmount: number, collateralValue: number): number {
//     if (collateralValue === 0) {
//       return 0;
//     }
//     return Math.round((loanAmount / collateralValue) * 10000) / 100; // Percentage with 2 decimals
//   }

//   /**
//    * Calculate Debt-to-Income (DTI) ratio
//    */
//   calculateDTI(totalEMI: number, monthlyIncome: number): number {
//     if (monthlyIncome === 0) {
//       return 100;
//     }
//     return Math.round((totalEMI / monthlyIncome) * 10000) / 100; // Percentage with 2 decimals
//   }

//   /**
//    * Generate amortization schedule
//    */
//   generateAmortizationSchedule(
//     principal: number,
//     annualRate: number,
//     months: number
//   ): Array<{
//     installmentNumber: number;
//     emi: number;
//     principalAmount: number;
//     interestAmount: number;
//     outstandingBalance: number;
//   }> {
//     const emi = this.calculateEMI(principal, annualRate, months);
//     const schedule = [];
//     let outstandingBalance = principal;

//     for (let i = 1; i <= months; i++) {
//       const interestAmount = this.calculatePeriodInterest(outstandingBalance, annualRate);
//       const principalAmount = this.calculatePeriodPrincipal(emi, interestAmount);
      
//       outstandingBalance = this.calculateOutstandingAfterPayment(outstandingBalance, principalAmount);
      
//       // Handle final installment rounding
//       if (i === months && outstandingBalance < 0) {
//         outstandingBalance = 0;
//       }

//       schedule.push({
//         installmentNumber: i,
//         emi: emi,
//         principalAmount: principalAmount,
//         interestAmount: interestAmount,
//         outstandingBalance: outstandingBalance
//       });
//     }

//     return schedule;
//   }

//   /**
//    * Calculate foreclosure amount
//    */
//   calculateForeclosureAmount(outstandingBalance: number, penaltyPercentage: number): {
//     outstandingBalance: number;
//     penalty: number;
//     totalAmount: number;
//   } {
//     const penalty = this.calculatePrepaymentCharges(outstandingBalance, penaltyPercentage);
//     const totalAmount = outstandingBalance + penalty;

//     return {
//       outstandingBalance: outstandingBalance,
//       penalty: penalty,
//       totalAmount: Math.round(totalAmount * 100) / 100
//     };
//   }

//   /**
//    * Format currency for display
//    */
//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'BDT',
//       minimumFractionDigits: 2
//     }).format(amount);
//   }

//   /**
//    * Format percentage for display
//    */
//   formatPercentage(value: number): string {
//     return `${value.toFixed(2)}%`;
//   }
// }