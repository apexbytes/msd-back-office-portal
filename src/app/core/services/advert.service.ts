import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Advert } from '../models/advert.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';

export type QueryParams = PaginationParams & SortParams;

@Injectable({
  providedIn: 'root',
})
export class AdvertService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}adverts`;

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

  getAdminAdverts(params?: QueryParams): Observable<ApiResponse<Advert[]>> {
    return this.http.get<ApiResponse<Advert[]>>(`${this.apiUrl}/admin`, {
      params: this.buildParams(params),
    });
  }

  createAdvert(advertData: Partial<Advert>): Observable<ApiResponse<Advert>> {
    return this.http.post<ApiResponse<Advert>>(this.apiUrl, advertData);
  }

  updateAdvert(id: string, advertData: Partial<Advert>): Observable<ApiResponse<Advert>> {
    return this.http.put<ApiResponse<Advert>>(`${this.apiUrl}/${id}`, advertData);
  }

  deleteAdvert(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  togglePublish(id: string): Observable<ApiResponse<Advert>> {
    return this.http.patch<ApiResponse<Advert>>(`${this.apiUrl}/${id}/toggle-publish`, {});
  }
}
