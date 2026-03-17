import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dtos/responses/base.response';
import { User } from '../models/user.model';
import { PaginationParams } from '../dtos/requests/pagination.request';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}users`;

  // ==========================================
  // CURRENT USER (ME) ENDPOINTS
  // ==========================================

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }

  updateCurrentUser(payload: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/me`, payload);
  }

  updatePassword(payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/me/password`, payload);
  }

  deleteCurrentUser(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/me`);
  }

  getUserActivity(params?: PaginationParams & any): Observable<ApiResponse<any>> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/activity`, { params: httpParams });
  }

  // ==========================================
  // USER MANAGEMENT (ADMIN ENDPOINTS)
  // ==========================================

  getAllUsers(params?: PaginationParams & any): Observable<ApiResponse<any>> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params: httpParams });
  }

  getClientUsers(params?: PaginationParams & any): Observable<ApiResponse<any>> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/clients`, { params: httpParams });
  }

  getAdminUsers(params?: PaginationParams & any): Observable<ApiResponse<any>> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admins`, { params: httpParams });
  }

  searchUsersForMentions(query: string): Observable<ApiResponse<User[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/search`, { params });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
  }

  createUser(payload: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, payload);
  }

  updateUser(id: string, payload: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUser(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  unlockUserAccount(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/unlock`, {});
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return httpParams;
  }
}
