import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

@Component({
  selector: 'app-custom-dialog',

  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.css',
})
export class CustomDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CustomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
