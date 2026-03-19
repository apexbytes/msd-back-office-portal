import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SupportService } from '@app/core/services/support.service';
import { SupportTicket } from '@app/core/models/support.model';
import { ApiResponse } from '@app/core/dtos/responses/base.response';
import { finalize } from 'rxjs';
import { TicketDialogComponent } from '@app/views/pages/forms/ticket-dialog/ticket-dialog.component';
import { InitialsPipe } from '@app/core/pipe/initials.pipe';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, InitialsPipe, FullNamePipe],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
})
export class TicketsComponent implements OnInit {
  private supportService = inject(SupportService);
  private dialog = inject(MatDialog);

  // Data signals
  tickets = signal<SupportTicket[]>([]);
  isLoading = signal(false);

  // Filters & Search
  searchQuery = signal<string>('');
  statusFilter = signal<string>('');

  currentPage = signal(1);
  limit = signal(10);
  totalTickets = signal(0);
  totalPages = signal(1);
  hasPrev = signal(false);
  hasNext = signal(false);

  showingFrom = computed(() => {
    if (this.totalTickets() === 0) return 0;
    return (this.currentPage() - 1) * this.limit() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.limit(), this.totalTickets());
  });

  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);

    const params: any = {
      limit: this.limit(),
      page: this.currentPage(),
    };

    if (this.statusFilter()) {
      params.status = this.statusFilter();
    }

    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }

    this.supportService
      .getAllTickets(params)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: ApiResponse<SupportTicket[]>) => {
          if (res.data) {
            this.tickets.set(res.data);

            if (res.pagination) {
              this.totalTickets.set(res.pagination.totalCount || 0);
              this.totalPages.set(res.pagination.totalPages || 1);
              this.hasPrev.set(res.pagination.hasPrev || false);
              this.hasNext.set(res.pagination.hasNext || false);
            }
          }
        },
        error: (err) => {
          console.error('Error fetching tickets:', err);
        },
      });
  }

  onSearch(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchQuery.set(input);
    this.currentPage.set(1);
    this.loadTickets();
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this.currentPage.set(1);
    this.loadTickets();
  }

  onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.loadTickets();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update((p) => p + 1);
      this.loadTickets();
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.loadTickets();
    }
  }

  openTicketDialog(id: string): void {
    const dialogRef = this.dialog.open(TicketDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      data: { id },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) this.loadTickets();
    });
  }
}
