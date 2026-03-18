import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '@app/core/services/audit.service';
import { AuditLog } from '@app/core/models/audit-log.model';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';

@Component({
  selector: 'app-logs',

  imports: [CommonModule, FullNamePipe],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly isLoading = signal(true);

  // Pagination Signals
  protected readonly currentPage = signal(1);
  protected readonly limit = signal(25);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly hasPrev = signal(false);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.auditService.getAuditLogs({ page: this.currentPage(), limit: this.limit() }).subscribe({
      next: (res: any) => {
        const data = res.data?.logs || res.data || [];
        this.logs.set(data);

        const pagination = res.pagination || res.data?.pagination;
        this.totalCount.set(pagination?.totalCount || res.data?.totalCount || data.length);
        this.currentPage.set(pagination?.currentPage || 1);
        this.totalPages.set(pagination?.totalPages || Math.ceil(this.totalCount() / this.limit()));
        this.hasNext.set(pagination?.hasNext || false);
        this.hasPrev.set(pagination?.hasPrev || false);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading audit logs', err);
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
      this.loadLogs();
    }
  }

  protected prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.loadLogs();
    }
  }

  protected onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.loadLogs();
  }
}
