import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { ApiResponse } from '../dtos/responses/base.response';

export interface MfaStatus {
  mfaEnabled: boolean;
  remainingBackupCodes: number;
  mfaRequired: boolean;
}

export interface BackupCodesResponse {
  message: string;
  backupCodes: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}mfa`;

  getMfaStatus(): Observable<ApiResponse<MfaStatus>> {
    return this.http.get<ApiResponse<MfaStatus>>(`${this.apiUrl}/status`);
  }

  enableMfa(password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/enable`, { password });
  }

  disableMfa(password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/disable`, { password });
  }

  generateBackupCodes(password: string): Observable<ApiResponse<BackupCodesResponse>> {
    return this.http.post<ApiResponse<BackupCodesResponse>>(`${this.apiUrl}/backup-codes`, {
      password,
    });
  }
}
