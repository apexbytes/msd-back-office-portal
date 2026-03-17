import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Role, Permission } from '../models/user.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';

export type QueryParams = PaginationParams & SortParams;

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}roles`;

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

  // --- Role Management ---

  getAllRoles(params?: QueryParams): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.apiUrl, {
      params: this.buildParams(params),
    });
  }

  getRoleById(id: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`);
  }

  createRole(roleData: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, roleData);
  }

  updateRole(id: string, roleData: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, roleData);
  }

  deleteRole(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // --- Permissions Management ---

  getAllPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/permissions`);
  }

  // --- User-Role Assignments ---

  assignRoleToUser(userId: string, roleId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/assign`, { userId, roleId });
  }

  removeRoleFromUser(userId: string, roleId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/remove`, { userId, roleId });
  }
}
