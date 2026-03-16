import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Vehicle, VehicleMake, VehicleModel } from '../models/vehicle.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';
import { AdminStatusUpdateRequest } from '../dtos/requests/admin.request';

export type QueryParams = PaginationParams & SortParams;

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}vehicles`;

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

  getAllVehiclesInSystem(params?: QueryParams): Observable<ApiResponse<Vehicle[]>> {
    return this.http.get<ApiResponse<Vehicle[]>>(`${this.apiUrl}/system`, {
      params: this.buildParams(params),
    });
  }

  adminManageVehicle(
    id: string,
    payload: AdminStatusUpdateRequest,
  ): Observable<ApiResponse<Vehicle>> {
    if (payload.featured !== undefined) {
      return this.http.patch<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}/feature`, {
        featured: payload.featured,
      });
    }

    return this.http.patch<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}/status`, {
      status: payload.status,
    });
  }

  getVehicleById(id: string): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}`);
  }

  createVehicle(vehicleData: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.http.post<ApiResponse<Vehicle>>(this.apiUrl, vehicleData);
  }

  updateVehicle(id: string, vehicleData: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.http.put<ApiResponse<Vehicle>>(`${this.apiUrl}/${id}`, vehicleData);
  }

  deleteVehicle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getAllMakes(): Observable<ApiResponse<VehicleMake[]>> {
    return this.http.get<ApiResponse<VehicleMake[]>>(`${this.apiUrl}/data/makes`);
  }

  createMake(makeData: Partial<VehicleMake>): Observable<ApiResponse<VehicleMake>> {
    return this.http.post<ApiResponse<VehicleMake>>(`${this.apiUrl}/data/makes`, makeData);
  }

  updateMake(id: string, makeData: Partial<VehicleMake>): Observable<ApiResponse<VehicleMake>> {
    return this.http.put<ApiResponse<VehicleMake>>(`${this.apiUrl}/data/makes/${id}`, makeData);
  }

  deleteMake(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/data/makes/${id}`);
  }

  getModelsByMake(makeId: string): Observable<ApiResponse<VehicleModel[]>> {
    return this.http.get<ApiResponse<VehicleModel[]>>(`${this.apiUrl}/data/makes/${makeId}/models`);
  }

  createModel(modelData: Partial<VehicleModel>): Observable<ApiResponse<VehicleModel>> {
    return this.http.post<ApiResponse<VehicleModel>>(`${this.apiUrl}/data/models`, modelData);
  }

  updateModel(id: string, modelData: Partial<VehicleModel>): Observable<ApiResponse<VehicleModel>> {
    return this.http.put<ApiResponse<VehicleModel>>(`${this.apiUrl}/data/models/${id}`, modelData);
  }

  deleteModel(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/data/models/${id}`);
  }
}
