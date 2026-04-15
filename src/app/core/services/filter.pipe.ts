import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: true
})
export class FilterPipe implements PipeTransform {
  /**
     * Transforms the input array by filtering it.
     * @param items The array of items (AccountListItem[] in your case).
     * @param propertyName The name of the property to filter by ('status').
     * @param matchingValue The value to match against ('active').
     * @returns The filtered array.
     */
  transform(items: any[] | null | undefined, propertyName: string, matchingValue: any): any[] {
    // 1. Handle null/undefined input array gracefully
    if (!items || items.length === 0) {
      return [];
    }

    // 2. Ensure propertyName and matchingValue are provided
    if (!propertyName || matchingValue === undefined) {
      return items;
    }

    // 3. Perform the case-insensitive filtering
    return items.filter(item => {
      if (item && item.hasOwnProperty(propertyName)) {
        const itemValue = item[propertyName];

        // Handle strings for case-insensitive comparison (recommended for status checks)
        if (typeof itemValue === 'string' && typeof matchingValue === 'string') {
          return itemValue.toLowerCase() === matchingValue.toLowerCase();
        }

        // Handle direct value comparison for non-strings (e.g., numbers, booleans)
        return itemValue === matchingValue;
      }
      return false;
    });
  }

}

@Pipe({
  name: 'sumAmount'
})
export class SumAmountPipe implements PipeTransform {
  transform(items: any[] | null | undefined): number {
    if (!items || items.length === 0) {
      return 0;
    }

    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
}
