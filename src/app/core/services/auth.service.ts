import { Injectable, signal, computed, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, fromEvent, merge, timer, of } from 'rxjs';
import { takeUntil, tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { User, Role } from '../models/user.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { LoginRequest, RegisterRequest, ResetPasswordRequest } from '../dtos/requests/auth.request';

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresMFA?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  currentUser = signal<User | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.currentUser());
  pendingCredentials = signal<LoginRequest | null>(null);

  showIdleWarning = signal<boolean>(false);
  countdownTimer = signal<number>(60);

  private destroy$ = new Subject<void>();
  private lastActivity$ = new BehaviorSubject<number>(Date.now());

  private readonly IDLE_TIMEOUT = 14 * 60 * 1000;
  private readonly WARNING_COUNTDOWN = 60;
  private readonly TOTAL_IDLE_TIME = 15 * 60 * 1000;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initActivityTracker();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Core Authentication ---

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}auth/login`, credentials)
      .pipe(
        tap((res) => {
          // <-- Updated check to match the new property name
          if (!res.data.requiresMFA) {
            this.handleAuthSuccess(res.data);
          }
        }),
      );
  }

  signup(data: RegisterRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}auth/register`, data)
      .pipe(tap((res) => this.handleAuthSuccess(res.data)));
  }

  handleAuthSuccess(data: LoginResponse): void {
    const allowedRoles = ['SUPERADMIN', 'SUPPORT'];
    const hasAccess = data.user.roles.some((role) =>
      allowedRoles.includes(role.name.toUpperCase()),
    );

    if (!hasAccess) {
      this.deleteCookie('accessToken');
      this.deleteCookie('refreshToken');
      this.currentUser.set(null);

      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('currentUser');
      }
      return;
    }

    this.setCookie('accessToken', data.accessToken, 1);
    this.currentUser.set(data.user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
  }

  updateUser(partialUser: Partial<User>): void {
    const current = this.currentUser();
    if (current) {
      const updatedUser = { ...current, ...partialUser };
      if (!partialUser.roles) {
        updatedUser.roles = current.roles;
      }
      this.currentUser.set(updatedUser);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}auth/logout`, {})
      .pipe(
        catchError((error) => {
          console.warn('Backend logout failed or session already expired', error);
          return of(null);
        }),
        finalize(() => {
          this.deleteCookie('accessToken');
          this.deleteCookie('refreshToken');
          this.currentUser.set(null);
          this.pendingCredentials.set(null);

          if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('currentUser');
          }

          this.router.navigate(['/login']);
        }),
      )
      .subscribe();
  }

  refreshToken(): Observable<ApiResponse<{ accessToken: string }>> {
    const refreshToken = this.getCookie('refreshToken');
    return this.http
      .post<
        ApiResponse<{ accessToken: string }>
      >(`${environment.apiUrl}auth/refresh-token`, { refreshToken })
      .pipe(
        tap((res) => {
          this.setCookie('accessToken', res.data.accessToken, 1);
        }),
      );
  }

  // --- Password Management ---

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}auth/forgot-password`, { email });
  }

  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}auth/reset-password`, data);
  }


  checkMfaStatus(): Observable<ApiResponse<{ enabled: boolean }>> {
    return this.http.get<ApiResponse<{ enabled: boolean }>>(`${environment.apiUrl}mfa/status`);
  }

  enableMfa(): Observable<ApiResponse<{ qrCode: string; secret: string }>> {
    return this.http.post<ApiResponse<{ qrCode: string; secret: string }>>(
      `${environment.apiUrl}mfa/enable`,
      {},
    );
  }

  disableMfa(token: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}mfa/disable`, { token });
  }

  generateBackupCodes(): Observable<ApiResponse<{ codes: string[] }>> {
    return this.http.post<ApiResponse<{ codes: string[] }>>(
      `${environment.apiUrl}mfa/backup-codes`,
      {},
    );
  }

  // --- Email Verification ---

  verifyEmail(token: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}auth/verify-email?token=${token}`);
  }

  resendVerificationEmail(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}auth/resend-verification`, {
      email,
    });
  }

  // --- Cookie Helpers ---

  getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  setCookie(name: string, value: string, days: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax; Secure';
  }

  deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Lax; Secure';
  }

  // --- Activity Tracker ---

  private initActivityTracker(): void {
    const activityEvents$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'click'),
      fromEvent(window, 'scroll'),
    );

    activityEvents$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastActivity$.next(Date.now());
      if (this.showIdleWarning()) {
        this.showIdleWarning.set(false);
        this.countdownTimer.set(this.WARNING_COUNTDOWN);
      }
    });

    timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = Date.now();
        const idleTime = now - this.lastActivity$.value;

        if (idleTime >= this.TOTAL_IDLE_TIME) {
          this.logout();
        } else if (idleTime >= this.IDLE_TIMEOUT) {
          this.showIdleWarning.set(true);
          const remaining = Math.max(0, Math.ceil((this.TOTAL_IDLE_TIME - idleTime) / 1000));
          this.countdownTimer.set(remaining);
        }
      });
  }

  private getStoredUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }
}
