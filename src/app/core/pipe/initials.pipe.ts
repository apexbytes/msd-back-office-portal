import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
})
export class InitialsPipe implements PipeTransform {
  private colors = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',
    '#FF5722',
    '#795548',
    '#9E9E9E',
    '#607D8B',
  ];

  transform(value: any, type: 'initials' | 'color' = 'initials'): string {
    if (!value) return '';

    // 1. Extract a string representation safely
    let nameString = '';

    if (typeof value === 'string') {
      nameString = value;
    } else {
      // Handle the User object
      if (value.firstName || value.lastName) {
        nameString = `${value.firstName || ''} ${value.lastName || ''}`.trim();
      } else if (value.companyName) {
        nameString = value.companyName;
      } else if (value.email) {
        nameString = value.email;
      } else {
        nameString = 'U'; // Fallback
      }
    }

    // 2. Return color if requested
    if (type === 'color') {
      return this.getColor(nameString);
    }

    // 3. Generate initials safely
    return nameString
      .split(/[\s_\.-]+/) // Splits by space, underscore, dot, or hyphen
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private getColor(name: string): string {
    if (!name) return this.colors[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % this.colors.length);
    return this.colors[index];
  }
}
