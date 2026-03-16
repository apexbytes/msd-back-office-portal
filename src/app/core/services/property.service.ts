import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Property } from '../models/property.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';
import { AdminStatusUpdateRequest } from '../dtos/requests/admin.request';

export type QueryParams = PaginationParams & SortParams;

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}properties`;

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


  getAllPropertiesInSystem(params?: QueryParams): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.apiUrl}/system`, {
      params: this.buildParams(params),
    });
  }

  adminManageProperty(
    id: string,
    payload: AdminStatusUpdateRequest,
  ): Observable<ApiResponse<Property>> {
    if (payload.featured !== undefined) {
      return this.http.patch<ApiResponse<Property>>(`${this.apiUrl}/${id}/feature`, {
        featured: payload.featured
      });
    }

    return this.http.patch<ApiResponse<Property>>(`${this.apiUrl}/${id}/status`, {
      status: payload.status
    });
  }

  getPropertyById(id: string): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.apiUrl}/${id}`);
  }

  createProperty(propertyData: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(this.apiUrl, propertyData);
  }

  updateProperty(id: string, propertyData: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.apiUrl}/${id}`, propertyData);
  }

  deleteProperty(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
