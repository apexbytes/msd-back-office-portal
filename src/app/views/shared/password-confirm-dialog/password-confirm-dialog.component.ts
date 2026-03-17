import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PasswordConfirmDialogData {
  title: string;
  message: string;
  actionText?: string;
}

@Component({
  selector: 'app-password-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordConfirmDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<PasswordConfirmDialogComponent>);
  public readonly data = inject<PasswordConfirmDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  showPassword = signal(false);
  form: FormGroup = this.fb.group({
    password: ['', Validators.required],
  });

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.password);
    }
  }
}
