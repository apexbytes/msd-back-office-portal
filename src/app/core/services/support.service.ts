import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { SupportTicket, TicketMessage } from '../models/support.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';

export type QueryParams = PaginationParams & SortParams;

// DTO for creating/updating a ticket
export interface SupportTicketRequest {
  subject?: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  message?: string; // Used when creating a new ticket
}

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}support`;

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

  // --- Admin Endpoints ---

  /**
   * Admin endpoint to view all support tickets across the platform.
   */
  getAllTickets(params?: QueryParams): Observable<ApiResponse<SupportTicket[]>> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/all`, {
      params: this.buildParams(params),
    });
  }

  /**
   * Admin endpoint to assign a ticket to a specific staff member.
   */
  assignTicket(ticketId: string, staffId: string): Observable<ApiResponse<SupportTicket>> {
    return this.http.patch<ApiResponse<SupportTicket>>(`${this.apiUrl}/${ticketId}/assign`, {
      assignedTo: staffId,
    });
  }

  // --- Shared / Management Endpoints ---

  /**
   * Get details of a specific ticket, including its message history.
   */
  getTicketById(id: string): Observable<ApiResponse<SupportTicket>> {
    return this.http.get<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update a ticket's status or priority (used by admins to mark as resolved, etc).
   */
  updateTicket(id: string, payload: SupportTicketRequest): Observable<ApiResponse<SupportTicket>> {
    return this.http.put<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Add a reply/message to an existing ticket.
   */
  addMessage(
    ticketId: string,
    message: string,
    attachments?: string[],
  ): Observable<ApiResponse<TicketMessage>> {
    return this.http.post<ApiResponse<TicketMessage>>(`${this.apiUrl}/${ticketId}/messages`, {
      message,
      attachments,
    });
  }

  // --- Client Endpoints ---

  /**
   * Get all tickets created by the currently authenticated user.
   */
  getMyTickets(params?: QueryParams): Observable<ApiResponse<SupportTicket[]>> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/me`, {
      params: this.buildParams(params),
    });
  }

  /**
   * Open a new support ticket.
   */
  createTicket(payload: SupportTicketRequest): Observable<ApiResponse<SupportTicket>> {
    return this.http.post<ApiResponse<SupportTicket>>(`${this.apiUrl}`, payload);
  }
}
