import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentageFormat'
})
export class PercentageFormatPipe implements PipeTransform {

  /**
   * Format number as percentage
   * @param value - The numeric value to format
   * @param decimals - Number of decimal places (default: 2)
   * @param showSymbol - Whether to show % symbol (default: true)
   * @returns Formatted percentage string
   * 
   * Examples:
   * {{ 8.5 | percentageFormat }} → "8.50%"
   * {{ 12.567 | percentageFormat:1 }} → "12.6%"
   * {{ 10 | percentageFormat:0:false }} → "10"
   * {{ 0.085 | percentageFormat:2:true:true }} → "8.50%" (multiply by 100)
   */
  transform(
    value: number | null | undefined,
    decimals: number = 2,
    showSymbol: boolean = true,
    multiplyBy100: boolean = false
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return showSymbol ? '0.00%' : '0.00';
    }

    // Multiply by 100 if value is in decimal form (e.g., 0.085 becomes 8.5)
    const displayValue = multiplyBy100 ? value * 100 : value;

    // Format with specified decimal places
    const formatted = displayValue.toFixed(decimals);

    return showSymbol ? `${formatted}%` : formatted;
  }
}
