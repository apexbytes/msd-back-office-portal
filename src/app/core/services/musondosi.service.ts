import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dtos/responses/base.response';
import { MusondosiDetails } from '../models/musondosi.model';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MusondosiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}musondosi`;

  getDetails(): Observable<ApiResponse<MusondosiDetails>> {
    return this.http.get<ApiResponse<MusondosiDetails>>(this.apiUrl);
  }

  createDetails(payload: Partial<MusondosiDetails>): Observable<ApiResponse<MusondosiDetails>> {
    return this.http.post<ApiResponse<MusondosiDetails>>(this.apiUrl, payload);
  }

  updateDetails(id: string, payload: Partial<MusondosiDetails>): Observable<ApiResponse<MusondosiDetails>> {
    return this.http.put<ApiResponse<MusondosiDetails>>(`${this.apiUrl}/${id}`, payload);
  }
}
