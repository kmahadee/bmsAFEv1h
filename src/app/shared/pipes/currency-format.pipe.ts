import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {

   /**
   * Format number as currency (BDT - Bangladeshi Taka)
   * @param value - The numeric value to format
   * @param currency - Currency code (default: 'BDT')
   * @param showSymbol - Whether to show currency symbol (default: true)
   * @returns Formatted currency string
   * 
   * Examples:
   * {{ 1000 | currencyFormat }} → "৳1,000.00"
   * {{ 1500.5 | currencyFormat:'USD' }} → "$1,500.50"
   * {{ 2000 | currencyFormat:'BDT':false }} → "2,000.00"
   */
  transform(value: number | null | undefined, currency: string = 'BDT', showSymbol: boolean = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      return showSymbol ? '৳0.00' : '0.00';
    }

    // Format number with commas and 2 decimal places
    const formattedNumber = value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (!showSymbol) {
      return formattedNumber;
    }

    // Currency symbols
    const symbols: { [key: string]: string } = {
      'BDT': '৳',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥'
    };

    const symbol = symbols[currency.toUpperCase()] || currency;

    return `${symbol}${formattedNumber}`;
  }

}
