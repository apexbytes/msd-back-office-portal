import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginResponse } from '@app/core/services/auth.service';
import { LoadingService } from '@app/core/services/loading.service';
import { ApiResponse } from '@app/core/dtos/responses/base.response';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-otp',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpComponent implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly loadingService = inject(LoadingService);

  protected readonly otpForm = this.fb.group({
    token: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern('^[0-9]*$'),
      ],
    ],
  });

  protected readonly resendCountdown = signal<number>(0);
  protected readonly canResend = computed(() => this.resendCountdown() === 0);
  private timerId?: any;

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
    else if (!this.authService.pendingCredentials()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const { token } = this.otpForm.getRawValue();
    const pendingCreds = this.authService.pendingCredentials();

    if (!pendingCreds) {
      this.router.navigate(['/login']);
      return;
    }

    const finalCredentials = {
      ...pendingCreds,
      mfaToken: token,
    };

    this.authService
      .login(finalCredentials)
      .pipe(catchError(() => of(null)))
      .subscribe((response: ApiResponse<LoginResponse> | null) => {
        if (response?.success && !response.data?.requiresMFA) {
          this.authService.pendingCredentials.set(null);
          this.router.navigate(['/home']);
        }
      });
  }

  onResend(): void {
    if (!this.canResend() || this.loadingService.isLoading()) {
      return;
    }

    const pendingCreds = this.authService.pendingCredentials();
    if (!pendingCreds) return;

    this.authService
      .login(pendingCreds)
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.startResendTimer();
        }),
      )
      .subscribe();
  }

  private startResendTimer(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.resendCountdown.set(60);
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    this.timerId = setInterval(() => {
      this.resendCountdown.update((v) => (v > 0 ? v - 1 : 0));
      if (this.resendCountdown() === 0) {
        clearInterval(this.timerId);
      }
    }, 1000);
  }
}
