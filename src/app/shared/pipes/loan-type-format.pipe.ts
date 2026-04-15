import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'loanTypeFormat'
})
export class LoanTypeFormatPipe implements PipeTransform {

  /**
   * Format loan type enum to readable text
   * @param value - Loan type enum value
   * @returns Formatted loan type string
   * 
   * Examples:
   * {{ 'HOME_LOAN' | loanTypeFormat }} → "Home Loan"
   * {{ 'PERSONAL_LOAN' | loanTypeFormat }} → "Personal Loan"
   * {{ 'IMPORT_LC_LOAN' | loanTypeFormat }} → "Import LC Loan"
   */
  transform(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    // Map of loan types to display names
    const loanTypeMap: { [key: string]: string } = {
      'HOME_LOAN': 'Home Loan',
      'CAR_LOAN': 'Car Loan',
      'PERSONAL_LOAN': 'Personal Loan',
      'EDUCATION_LOAN': 'Education Loan',
      'BUSINESS_LOAN': 'Business Loan',
      'GOLD_LOAN': 'Gold Loan',
      'INDUSTRIAL_LOAN': 'Industrial Loan',
      'IMPORT_LC_LOAN': 'Import LC Loan',
      'WORKING_CAPITAL_LOAN': 'Working Capital Loan'
    };

    const upperValue = value.toUpperCase();
    
    // Return mapped value or format the string
    return loanTypeMap[upperValue] || this.formatString(value);
  }

  /**
   * Format string by replacing underscores and capitalizing
   */
  private formatString(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
