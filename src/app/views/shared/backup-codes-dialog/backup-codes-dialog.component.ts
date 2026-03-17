import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

export interface BackupCodesDialogData {
  backupCodes: string[];
}

@Component({
  selector: 'app-backup-codes-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backup-codes-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class BackupCodesDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<BackupCodesDialogComponent>);
  public readonly data = inject<BackupCodesDialogData>(MAT_DIALOG_DATA);

  hasSaved = signal(false);

  copyToClipboard(): void {
    const codes = this.data.backupCodes.join('\n');
    navigator.clipboard.writeText(codes);
    alert('Backup codes copied to clipboard!'); // Replace with toast if available
  }

  downloadTxt(): void {
    const codes = this.data.backupCodes.join('\n');
    const blob = new Blob([`MFA Backup Codes\n\n${codes}\n\nKeep these safe.`], {
      type: 'text/plain',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onClose(): void {
    this.dialogRef.close(true);
  }
}
