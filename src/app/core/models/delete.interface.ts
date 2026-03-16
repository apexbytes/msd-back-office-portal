import {Observable} from 'rxjs';

export interface DeleteDialogData {
  entityName: string;      // e.g., 'Vehicle',
  title?: string;          // Optional override: 'Delete Car?'
  message?: string;        // Optional override: 'Are you sure...?'
  deleteFn: () => Observable<any>; // The actual API call to run
}
