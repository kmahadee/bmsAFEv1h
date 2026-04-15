import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {

  /**
   * Format date string or Date object to readable format
   * @param value - Date string, Date object, or timestamp
   * @param format - Format type ('short', 'medium', 'long', 'full', 'custom')
   * @param customFormat - Custom format string (for format='custom')
   * @returns Formatted date string
   * 
   * Examples:
   * {{ '2024-01-15' | dateFormat }} → "Jan 15, 2024"
   * {{ date | dateFormat:'long' }} → "January 15, 2024"
   * {{ date | dateFormat:'short' }} → "01/15/2024"
   */
  transform(
    value: string | Date | number | null | undefined,
    format: 'short' | 'medium' | 'long' | 'full' | 'custom' = 'medium',
    customFormat?: string
  ): string {
    if (!value) {
      return '-';
    }

    let date: Date;

    // Convert to Date object
    if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      date = value;
    }

    // Validate date
    if (isNaN(date.getTime())) {
      return '-';
    }

    switch (format) {
      case 'short':
        // 01/15/2024
        return date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });

      case 'medium':
        // Jan 15, 2024
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

      case 'long':
        // January 15, 2024
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

      case 'full':
        // Monday, January 15, 2024
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

      case 'custom':
        if (customFormat) {
          return this.formatCustom(date, customFormat);
        }
        return date.toLocaleDateString('en-US');

      default:
        return date.toLocaleDateString('en-US');
    }
  }

  /**
   * Format date with custom format string
   * Supported tokens: YYYY, MM, DD, HH, mm, ss, MMM, MMMM
   */
  private formatCustom(date: Date, format: string): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthsShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const map: { [key: string]: string } = {
      'YYYY': date.getFullYear().toString(),
      'MM': this.pad(date.getMonth() + 1),
      'DD': this.pad(date.getDate()),
      'HH': this.pad(date.getHours()),
      'mm': this.pad(date.getMinutes()),
      'ss': this.pad(date.getSeconds()),
      'MMMM': months[date.getMonth()],
      'MMM': monthsShort[date.getMonth()]
    };

    return format.replace(/YYYY|MMMM|MMM|MM|DD|HH|mm|ss/g, (matched) => map[matched]);
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}
