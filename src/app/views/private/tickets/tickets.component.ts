import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService } from '@app/core/services/support.service';
import { LoadingService } from '@app/core/services/loading.service';
import { SupportTicket } from '@app/core/models/support.model';
import { MatDialog } from '@angular/material/dialog';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';
import { TicketDialogComponent } from '@app/views/private/ticket-dialog/ticket-dialog.component';

@Component({
  selector: 'app-tickets',

  imports: [CommonModule, FullNamePipe],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsComponent implements OnInit {
  private readonly supportService = inject(SupportService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialog = inject(MatDialog);

  protected readonly tickets = signal<SupportTicket[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly updatingIds = signal<Set<string>>(new Set());

  // Pagination Signals
  protected readonly currentPage = signal(1);
  protected readonly limit = signal(10);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly hasPrev = signal(false);

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);
    this.supportService.getAllTickets({ page: this.currentPage(), limit: this.limit() }).subscribe({
      next: (res: any) => {
        const data = res.data?.tickets || res.data || [];
        this.tickets.set(data);
        console.log('Tickets:', data);

        const pagination = res.pagination || res.data?.pagination;
        this.totalCount.set(pagination?.totalCount || res.data?.totalCount || data.length);
        this.currentPage.set(pagination?.currentPage || 1);
        this.totalPages.set(pagination?.totalPages || Math.ceil(this.totalCount() / this.limit()));
        this.hasNext.set(pagination?.hasNext || false);
        this.hasPrev.set(pagination?.hasPrev || false);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.isLoading.set(false);
      },
    });
  }

  // --- Pagination Methods ---
  protected get showingFrom(): number {
    return this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.limit() + 1;
  }

  protected get showingTo(): number {
    return Math.min(this.currentPage() * this.limit(), this.totalCount());
  }

  protected nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update((p) => p + 1);
      this.loadTickets();
    }
  }

  protected prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.loadTickets();
    }
  }

  protected onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.loadTickets();
  }
  // --------------------------

  private updateTicketState(id: string, payload: any): void {
    const currentSet = new Set(this.updatingIds());
    currentSet.add(id);
    this.updatingIds.set(currentSet);

    this.supportService.updateTicket(id, payload).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const updatedTicket = res.data;
          this.tickets.update((items) =>
            items.map((t) => (t.id === id ? { ...t, ...updatedTicket } : t)),
          );
        }
        this.removeUpdatingId(id);
      },
      error: (err) => {
        console.error(`Failed to update ticket ${id}`, err);
        this.removeUpdatingId(id);
      },
    });
  }

  private removeUpdatingId(id: string): void {
    const currentSet = new Set(this.updatingIds());
    currentSet.delete(id);
    this.updatingIds.set(currentSet);
  }

  protected isUpdating(id: string): boolean {
    return this.updatingIds().has(id);
  }

  // --- Quick Actions ---
  protected onMarkInProgress(ticket: SupportTicket): void {
    this.updateTicketState(ticket.id, { status: 'IN_PROGRESS' });
  }

  protected onResolve(ticket: SupportTicket): void {
    this.updateTicketState(ticket.id, { status: 'RESOLVED' });
  }

  protected onClose(ticket: SupportTicket): void {
    this.updateTicketState(ticket.id, { status: 'CLOSED' });
  }

  protected onReopen(ticket: SupportTicket): void {
    this.updateTicketState(ticket.id, { status: 'OPEN' });
  }

  protected onViewDetails(ticket: SupportTicket): void {
    const dialogRef = this.dialog.open(TicketDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: { ticketId: ticket.id },
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket && typeof updatedTicket === 'object') {
        this.tickets.update((items) =>
          items.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t)),
        );
      }
      else if (updatedTicket === true) {
        this.loadTickets();
      }
    });
  }
}
