import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginResponse } from '@app/core/services/auth.service';
import { LoadingService } from '@app/core/services/loading.service';
import { ApiResponse } from '@app/core/dtos/responses/base.response';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly loadingService = inject(LoadingService);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();

    this.authService
      .login(credentials)
      .pipe(catchError(() => of(null)))
      .subscribe((response: ApiResponse<LoginResponse> | null) => {
        if (response?.success) {
          if (response.data?.requiresMFA) {
            this.authService.pendingCredentials.set(credentials);
            this.router.navigate(['/otp']);
          } else {
            this.router.navigate(['/home']);
          }
        }
      });
  }
}
