import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dtos/responses/base.response';
import { SupportTicket, TicketMessage } from '../models/support.model';
import { PaginationParams } from '../dtos/requests/pagination.request';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}support`;

  createTicket(payload: any): Observable<ApiResponse<SupportTicket>> {
    return this.http.post<ApiResponse<SupportTicket>>(this.apiUrl, payload);
  }

  getMyTickets(): Observable<ApiResponse<SupportTicket[]>> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/my-tickets`);
  }

  getAllTickets(params?: PaginationParams & any): Observable<ApiResponse<any>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params: httpParams });
  }

  getTicketById(id: string): Observable<ApiResponse<SupportTicket>> {
    return this.http.get<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`);
  }

  addMessage(ticketId: string, message: string): Observable<ApiResponse<TicketMessage>> {
    return this.http.post<ApiResponse<TicketMessage>>(`${this.apiUrl}/${ticketId}/messages`, {
      message,
    });
  }

  updateTicket(id: string, payload: any): Observable<ApiResponse<SupportTicket>> {
    return this.http.put<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`, payload);
  }
}
