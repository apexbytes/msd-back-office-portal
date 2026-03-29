import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dtos/responses/base.response';
import { environment } from '@/environments/environment';

export interface MyStatsResponse {
  success: boolean;
  counts: {
    myListings: {
      vehiclesTotal: number;
      vehiclesPublished: number;
      propertiesTotal: number;
      propertiesPublished: number;
    };
    openTickets: number;
    activeSubscriptions: {
      type: string;
      status: string;
      uploadLimit: number;
      currentUsage: number;
      endDate: string;
    }[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}stats/`;

  getMyStats(): Observable<MyStatsResponse> {
    return this.http.get<MyStatsResponse>(`${this.apiUrl}my-stats`);
  }

  getAdminStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}admin`);
  }
}
