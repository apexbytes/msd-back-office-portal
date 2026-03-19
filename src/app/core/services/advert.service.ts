import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Advert } from '../models/advert.model';
import { ApiResponse } from '@app/core/dtos/responses/base.response';

@Injectable({
  providedIn: 'root',
})
export class AdvertService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}adverts`;

  // Public/Published Adverts
  getPublishedAdverts(params: any = {}): Observable<ApiResponse<Advert[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<Advert[]>>(`${this.apiUrl}/published`, { params: httpParams });
  }

  // Admin: All Adverts
  getAllAdvertsInSystem(params: any = {}): Observable<ApiResponse<Advert[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<Advert[]>>(`${this.apiUrl}`, { params: httpParams });
  }

  getAdvertById(id: string): Observable<ApiResponse<Advert>> {
    return this.http.get<ApiResponse<Advert>>(`${this.apiUrl}/${id}`);
  }

  createAdvert(data: Partial<Advert>): Observable<ApiResponse<Advert>> {
    return this.http.post<ApiResponse<Advert>>(`${this.apiUrl}`, data);
  }

  updateAdvert(id: string, data: Partial<Advert>): Observable<ApiResponse<Advert>> {
    return this.http.put<ApiResponse<Advert>>(`${this.apiUrl}/${id}`, data);
  }

  togglePublishState(id: string): Observable<ApiResponse<Advert>> {
    return this.http.put<ApiResponse<Advert>>(`${this.apiUrl}/${id}/toggle`, {});
  }

  deleteAdvert(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
