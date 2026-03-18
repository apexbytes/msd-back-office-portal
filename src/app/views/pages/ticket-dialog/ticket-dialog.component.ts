import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SupportService } from '@app/core/services/support.service';
import { AuthService } from '@app/core/services/auth.service';
import { UserService } from '@app/core/services/user.service'; // <-- Import UserService
import { SupportTicket, TicketStatus, TicketPriority } from '@app/core/models/support.model';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, FullNamePipe],
  templateUrl: './ticket-dialog.component.html',
  styleUrl: './ticket-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDialogComponent implements OnInit, AfterViewChecked {
  private readonly supportService = inject(SupportService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService); // <-- Inject it here
  protected readonly dialogRef = inject(MatDialogRef<TicketDialogComponent>);
  public readonly data = inject<{ ticketId: string }>(MAT_DIALOG_DATA);

  @ViewChild('messageScrollContainer') private scrollContainer!: ElementRef;

  protected ticket = signal<SupportTicket | null>(null);
  protected isLoading = signal(true);
  protected isSending = signal(false);
  protected isUpdating = signal(false);
  protected hasChanges = signal(false);

  protected newMessage = signal('');

  // Reassignment Signals
  protected isReassigning = signal(false);
  protected adminUsers = signal<any[]>([]);

  private currentUser = this.authService.currentUser;

  // RBAC Computations
  protected isSuperAdmin = computed(() => {
    const user = this.currentUser();
    return user?.roles.some((r) => r.name.toUpperCase() === 'SUPERADMIN') ?? false;
  });

  protected canManage = computed(() => {
    if (this.isSuperAdmin()) return true;
    const t = this.ticket();
    const user = this.currentUser();
    return t?.assignedTo === user?.id;
  });

  protected isClosedOrResolved = computed(() => {
    const status = this.ticket()?.status;
    return status === 'CLOSED' || status === 'RESOLVED';
  });

  ngOnInit(): void {
    this.loadTicket();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private loadTicket(): void {
    this.isLoading.set(true);
    this.supportService.getTicketById(this.data.ticketId).subscribe({
      next: (res: any) => {
        this.ticket.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ticket details', err);
        this.isLoading.set(false);
      },
    });
  }

  protected getAvatarUrl(avatar: any): string | null {
    if (!avatar) return null;
    if (typeof avatar === 'string') return avatar;
    return avatar.url || null;
  }

  // --- Reassignment Logic ---
  protected toggleReassign(): void {
    this.isReassigning.set(!this.isReassigning());

    if (this.isReassigning() && this.adminUsers().length === 0) {
      this.userService.getAdminUsers().subscribe({
        next: (res: any) => {
          const data = res.data?.users || res.data?.items || res.data || [];

          this.adminUsers.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Failed to load admin users', err);
          this.adminUsers.set([]);
        },
      });
    }
  }

  protected updateAssignee(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newAssigneeId = select.value || null;

    this.isReassigning.set(false);

    // 1. INSTANTLY mark that a change occurred so it doesn't get lost on close
    this.hasChanges.set(true);

    if (newAssigneeId) {
      const selectedAdmin = this.adminUsers().find((a) => a.id === newAssigneeId);
      if (selectedAdmin) {
        this.ticket.update((t) => {
          if (!t) return t;
          return {
            ...t,
            assignedTo: newAssigneeId,
            assignee: {
              id: selectedAdmin.id,
              firstName: selectedAdmin.firstName,
              lastName: selectedAdmin.lastName,
            },
          };
        });
      }
    } else {
      this.ticket.update((t) => {
        if (!t) return t;
        const updated = { ...t, assignedTo: null };
        delete updated.assignee;
        return updated;
      });
    }

    this.performUpdate({ assignedTo: newAssigneeId });
  }

  // --- Updates and Messaging ---
  protected sendMessage(): void {
    const message = this.newMessage().trim();
    if (!message || this.isClosedOrResolved()) return;

    this.isSending.set(true);
    this.supportService.addMessage(this.data.ticketId, message).subscribe({
      next: (res: any) => {
        this.hasChanges.set(true);
        this.ticket.update((t) => {
          if (!t) return t;
          return { ...t, messages: [...(t.messages || []), res.data] };
        });
        this.newMessage.set('');
        this.isSending.set(false);
      },
      error: (err) => {
        console.error('Failed to send message', err);
        this.isSending.set(false);
      },
    });
  }

  protected updateStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.performUpdate({ status: select.value as TicketStatus });
  }

  protected updatePriority(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.performUpdate({ priority: select.value as TicketPriority });
  }

  private performUpdate(payload: any): void {
    if (!this.canManage()) return;

    this.isUpdating.set(true);
    this.supportService.updateTicket(this.data.ticketId, payload).subscribe({
      next: (res: any) => {
        this.hasChanges.set(true);
        this.ticket.update((t) => ({ ...t, ...res.data }));
        this.isUpdating.set(false);
      },
      error: (err) => {
        console.error('Failed to update ticket', err);
        this.isUpdating.set(false);
        this.loadTicket();
      },
    });
  }

  protected closeDialog(): void {
    this.dialogRef.close(this.hasChanges() ? this.ticket() : false);
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
