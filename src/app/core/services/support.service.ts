import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { SupportTicket } from '../models/support.model';
import { ApiResponse } from '@app/core/dtos/responses/base.response';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}support`;

  // For regular users
  getMyTickets(): Observable<ApiResponse<SupportTicket[]>> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/my-tickets`);
  }

  // For Admins
  getAllTickets(params: any = {}): Observable<ApiResponse<SupportTicket[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}`, { params: httpParams });
  }

  getTicketById(id: string): Observable<ApiResponse<SupportTicket>> {
    return this.http.get<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`);
  }

  // Public/Guest or Auth creation
  createTicket(data: Partial<SupportTicket>): Observable<ApiResponse<SupportTicket>> {
    return this.http.post<ApiResponse<SupportTicket>>(`${this.apiUrl}`, data);
  }

  // Admin updates
  updateTicket(id: string, data: Partial<SupportTicket>): Observable<ApiResponse<SupportTicket>> {
    return this.http.put<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`, data);
  }

  // Adding replies
  addMessage(id: string, message: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/messages`, { message });
  }
}
