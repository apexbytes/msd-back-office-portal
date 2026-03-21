import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SupportService } from '@app/core/services/support.service';
import { UserService } from '@app/core/services/user.service';
import { SupportTicket } from '@app/core/models/support.model';
import { User } from '@app/core/models/user.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './ticket-dialog.component.html',
  styleUrls: ['./ticket-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supportService = inject(SupportService);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<TicketDialogComponent>);
  private dialogData = inject(MAT_DIALOG_DATA);

  ticket = signal<SupportTicket | null>(null);
  admins = signal<User[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isReplying = signal(false);

  adminForm!: FormGroup;
  replyControl = this.fb.control('', Validators.required);

  ngOnInit(): void {
    this.adminForm = this.fb.group({
      status: ['', Validators.required],
      priority: ['', Validators.required],
      assignedTo: [null],
    });

    this.loadAdmins();
    this.loadTicket();
  }

  loadAdmins(): void {
    this.userService.getAdminUsers({ limit: 100 }).subscribe({
      next: (res: any) => {
        const adminArray = res.data?.users || res.users || [];
        this.admins.set(adminArray);
      },
      error: (err) => console.error('Failed to load admins:', err),
    });
  }

  loadTicket(): void {
    this.isLoading.set(true);
    this.supportService
      .getTicketById(this.dialogData.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const data = res.data || res;
          this.ticket.set(data);
          this.adminForm.patchValue({
            status: data.status,
            priority: data.priority,
            assignedTo: data.assignedTo,
          });
        },
        error: () => this.closeDialog(false),
      });
  }

  onSaveAdminChanges(): void {
    if (this.adminForm.invalid) return;

    this.isSaving.set(true);
    this.supportService
      .updateTicket(this.dialogData.id, this.adminForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          const updated = { ...this.ticket()!, ...this.adminForm.value };
          this.ticket.set(updated);
        },
      });
  }

  sendReply(): void {
    if (this.replyControl.invalid) return;

    this.isReplying.set(true);
    this.supportService
      .addMessage(this.dialogData.id, this.replyControl.value!)
      .pipe(finalize(() => this.isReplying.set(false)))
      .subscribe({
        next: () => {
          this.replyControl.reset();
          this.loadTicket();
        },
      });
  }

  closeDialog(success: boolean = false): void {
    this.dialogRef.close(success);
  }

  isStaff(user: any): boolean {
    if (!user) return false;

    const currentTicket = this.ticket();
    if (!currentTicket) return false;

    if (!currentTicket.userId) return true;

    return user.id !== currentTicket.userId;
  }
}
