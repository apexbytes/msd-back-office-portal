import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { PaginationParams, SortParams } from '@app/core/dtos/requests/pagination.request';
import { ApiResponse } from '@app/core/dtos/responses/base.response';
import { Subscription } from '@app/core/models/subscription.model';
import { GrantSubscriptionRequest } from '@app/core/dtos/requests/admin.request';

export type QueryParams = PaginationParams &
  SortParams & {
    type?: string;
    status?: string;
    search?: string;
  };

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}subscriptions`;

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

  /** Get all subscriptions (Paginated) */
  getAllSubscriptions(params?: QueryParams): Observable<ApiResponse<Subscription[]>> {
    return this.http.get<ApiResponse<Subscription[]>>(`${this.apiUrl}`, {
      params: this.buildParams(params),
    });
  }

  /** Grant or Top-up a subscription */
  grantSubscription(
    userId: string,
    payload: GrantSubscriptionRequest | any,
  ): Observable<ApiResponse<Subscription>> {
    return this.http.post<ApiResponse<Subscription>>(
      `${this.apiUrl}/user/${userId}/grant`,
      payload,
    );
  }

  /** Explicitly Override a subscription limit/duration */
  overrideSubscription(
    userId: string,
    payload: GrantSubscriptionRequest | any,
  ): Observable<ApiResponse<Subscription>> {
    // Note: The payload expects 'durationMonths' instead of 'duration'
    return this.http.put<ApiResponse<Subscription>>(`${this.apiUrl}/override/${userId}`, payload);
  }

  /** Cancel an active subscription */
  cancelSubscription(userId: string, type: string): Observable<ApiResponse<void>> {
    // Aligned to backend: PUT /v2/subscription/cancel/:userId/:type
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/cancel/${userId}/${type}`, {});
  }

  /** Trigger notifications for expiring subscriptions */
  notifyExpiringSubscriptions(): Observable<ApiResponse<any>> {
    // Aligned to backend: POST /v2/subscription/notify-expiring
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/notify-expiring`, {});
  }

  // --- Client Endpoints ---

  /** Get the authenticated user's active subscriptions */
  getMySubscriptions(): Observable<ApiResponse<any>> {
    // Aligned to backend: GET /v2/subscription/me
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/me`);
  }
}
