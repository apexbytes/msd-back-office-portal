import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { AuditService } from '@app/core/services/audit.service';
import { AuditLog } from '@app/core/models/audit-log.model';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FullNamePipe],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly isLoading = signal(true);

  // Search and Filter Signals
  protected readonly searchQuery = signal('');
  protected readonly entityTypeFilter = signal('');
  protected readonly actionFilter = signal('');

  // Pagination Signals
  protected readonly currentPage = signal(1);
  protected readonly limit = signal(25);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly hasPrev = signal(false);

  // Subject to handle request streams
  private readonly loadSubject = new Subject<void>();

  constructor() {
    // Setup RxJS Pipeline to prevent race conditions
    this.loadSubject
      .pipe(
        debounceTime(300), // Wait 300ms after last keystroke before fetching
        switchMap(() => {
          this.isLoading.set(true);
          const params: any = {
            page: this.currentPage(),
            limit: this.limit(),
          };

          if (this.searchQuery()) params.search = this.searchQuery();
          if (this.entityTypeFilter()) params.resourceType = this.entityTypeFilter();
          if (this.actionFilter()) params.action = this.actionFilter();

          // switchMap will cancel the previous HTTP request if a new one arrives
          return this.auditService.getAuditLogs(params).pipe(
            catchError((err) => {
              console.error('Error loading audit logs', err);
              this.isLoading.set(false);
              return of(null); // Return null to keep stream alive
            }),
          );
        }),
        takeUntilDestroyed(), // Auto-cleanup when component destroys
      )
      .subscribe((res: any) => {
        if (!res) return;

        const data = res.data?.logs || res.data || [];
        this.logs.set(data);

        const pagination = res.pagination || res.data?.pagination;
        this.totalCount.set(pagination?.totalCount || res.data?.totalCount || data.length);
        this.currentPage.set(pagination?.currentPage || 1);
        this.totalPages.set(pagination?.totalPages || Math.ceil(this.totalCount() / this.limit()));
        this.hasNext.set(pagination?.hasNext || false);
        this.hasPrev.set(pagination?.hasPrev || false);

        this.isLoading.set(false);
      });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    // Trigger the reactive pipeline instead of subscribing directly
    this.loadSubject.next();
  }

  // --- Filter Methods ---
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  protected onEntityTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.entityTypeFilter.set(select.value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  protected onActionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.actionFilter.set(select.value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  // Bind this to your Filter button
  protected applyFilters(): void {
    this.currentPage.set(1);
    this.loadLogs();
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
