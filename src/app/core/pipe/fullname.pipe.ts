import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fullName',
  standalone: true
})
export class FullNamePipe implements PipeTransform {
  transform(author: { firstName?: string; lastName?: string } | null | undefined): string {
    const first = author?.firstName?.trim() || 'Unknown';
    const last = author?.lastName?.trim() || 'Unknown';
    return `${first} ${last}`;
  }
}
