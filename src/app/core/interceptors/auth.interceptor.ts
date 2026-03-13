import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';
import { environment } from '../../../environments/environment';
import { CustomDialogComponent } from '../../views/shared/custom-dialog/custom-dialog.component';
import {
  catchError,
  finalize,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
  tap,
  Observable,
} from 'rxjs';

let isRefreshing = false;
let isShowingConnectionError = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const snackBar = inject(MatSnackBar);
  const dialog = inject(MatDialog);

  const isApiRequest = req.url.includes(environment.apiUrl);

  let authReq = req;

  if (isApiRequest) {
    loadingService.show();

    const accessToken = authService.getCookie('accessToken');

    authReq = req.clone({
      withCredentials: true,
      setHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  }

  return next(authReq).pipe(
    tap((event: HttpEvent<any>) => {
      if (
        event instanceof HttpResponse &&
        isApiRequest &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
        event.body?.message
      ) {
        snackBar.open(event.body.message, 'X', {
          duration: 3000000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest) {
        // Handle Server Connection Error
        if (error.status === 0 && !isShowingConnectionError) {
          isShowingConnectionError = true;
          dialog
            .open(CustomDialogComponent, {
              data: {
                title: 'Connection Error',
                message: 'Unable to connect to the server. Please check your internet connection or try again later.',
                confirmText: 'Okay',
              },
              disableClose: true,
            })
            .afterClosed()
            .subscribe(() => {
              isShowingConnectionError = false;
            });
          return throwError(() => error);
        }

        // Handle Automatic Token Refresh
        const isAuthEndpoint = req.url.includes('/auth');
        const isMissingToken = error.error?.error?.code === 'MISSING_TOKEN' || error.error?.message?.includes('Missing Token');

        if (
          error.status === 401 &&
          !isAuthEndpoint &&
          !req.url.includes('/refresh')
        ) {
          return handle401Error(authReq, next, authService, snackBar);
        }

        if (isMissingToken && !isAuthEndpoint) {
          return handle401Error(authReq, next, authService, snackBar);
        }

        // General API Errors
        if (error.status !== 401 && !req.url.includes('/refresh')) {
          const errorMessage = error.error?.message || error.error?.error?.message || 'An unexpected error occurred';
          snackBar.open(errorMessage, 'X', {
            duration: 500000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
      return throwError(() => error);
    }),
    finalize(() => {
      if (isApiRequest) {
        loadingService.hide();
      }
    })
  );
};

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  snackBar: MatSnackBar
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res) => {
        isRefreshing = false;
        const newToken = res.data.accessToken;
        refreshTokenSubject.next(newToken);
        return next(
          request.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          })
        );
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        snackBar.open('Session expired. Please log in again.', 'Close', {
          duration: 500000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        return throwError(() => err);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) =>
      next(
        request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        })
      )
    )
  );
}
