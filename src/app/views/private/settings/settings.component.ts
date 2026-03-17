import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { MfaStatus, SecurityService } from '@app/core/services/security.service';
import {
  PasswordConfirmDialogComponent
} from '@app/views/shared/password-confirm-dialog/password-confirm-dialog.component';
import { BackupCodesDialogComponent } from '@app/views/shared/backup-codes-dialog/backup-codes-dialog.component';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private readonly securityService = inject(SecurityService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = signal(true);
  isActionLoading = signal(false);
  mfaStatus = signal<MfaStatus | null>(null);

  ngOnInit(): void {
    this.loadSecurityStatus();
  }

  private loadSecurityStatus(): void {
    this.isLoading.set(true);
    this.securityService
      .getMfaStatus()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => this.mfaStatus.set(res.data),
        error: (err) => console.error('Failed to load MFA status', err),
      });
  }

  toggleMFA(): void {
    const currentStatus = this.mfaStatus();
    if (!currentStatus) return;

    const isEnabling = !currentStatus.mfaEnabled;
    const dialogRef = this.dialog.open(PasswordConfirmDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: isEnabling ? 'Enable Multi-Factor Auth' : 'Disable Multi-Factor Auth',
        message: isEnabling
          ? 'Enter your password to enable MFA. You will be prompted to verify via email on your next login.'
          : 'Enter your password to disable MFA. This will reduce your account security.',
        actionText: isEnabling ? 'Enable MFA' : 'Disable MFA',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((password) => {
        if (!password) return;

        this.isActionLoading.set(true);
        const action$ = isEnabling
          ? this.securityService.enableMfa(password)
          : this.securityService.disableMfa(password);

        action$.pipe(finalize(() => this.isActionLoading.set(false))).subscribe({
          next: (res) => {
            alert(res.message);
            this.loadSecurityStatus();
          },
          error: (err) => {
            const msg = err.error?.error?.message || 'An error occurred';
            alert(msg);
          },
        });
      });
  }

  generateBackupCodes(): void {
    const dialogRef = this.dialog.open(PasswordConfirmDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Generate Backup Codes',
        message:
          'Generating new codes will invalidate your existing ones. Enter your password to proceed.',
        actionText: 'Generate Codes',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((password) => {
        if (!password) return;

        this.isActionLoading.set(true);
        this.securityService
          .generateBackupCodes(password)
          .pipe(finalize(() => this.isActionLoading.set(false)))
          .subscribe({
            next: (res) => {
              this.dialog.open(BackupCodesDialogComponent, {
                width: '550px',
                disableClose: true,
                data: { backupCodes: res.data.backupCodes },
              });
              this.loadSecurityStatus();
            },
            error: (err) => alert(err.error?.error?.message || 'Failed to generate codes'),
          });
      });
  }
}
