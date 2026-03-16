import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Partner } from '../models/partner.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';

export type QueryParams = PaginationParams & SortParams;

@Injectable({
  providedIn: 'root',
})
export class PartnerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}partners`;

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return httpParams;
  }

  // In src/app/core/services/partner.service.ts

  getAllPartners(params?: QueryParams): Observable<ApiResponse<Partner[]>> {
    return this.http.get<ApiResponse<Partner[]>>(`${this.apiUrl}/admin`, {
      params: this.buildParams(params),
    });
  }

  getActivePartners(): Observable<ApiResponse<Partner[]>> {
    return this.http.get<ApiResponse<Partner[]>>(`${this.apiUrl}/active`);
  }

  createPartner(partnerData: Partial<Partner>): Observable<ApiResponse<Partner>> {
    return this.http.post<ApiResponse<Partner>>(this.apiUrl, partnerData);
  }

  updatePartner(id: string, partnerData: Partial<Partner>): Observable<ApiResponse<Partner>> {
    return this.http.put<ApiResponse<Partner>>(`${this.apiUrl}/${id}`, partnerData);
  }

  deletePartner(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
