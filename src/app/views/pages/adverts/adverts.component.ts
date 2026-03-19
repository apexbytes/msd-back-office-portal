import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdvertService } from '@app/core/services/advert.service';
import { Advert } from '@app/core/models/advert.model';
import { ApiResponse } from '@app/core/dtos/responses/base.response';
import { finalize } from 'rxjs';

import { AdvertFormComponent } from '../forms/advert-form/advert-form.component';
import { DeleteDialogComponent } from '../../shared/delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-adverts',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './adverts.component.html',
  styleUrls: ['./adverts.component.css'],
})
export class AdvertsComponent implements OnInit {
  private advertService = inject(AdvertService);
  private dialog = inject(MatDialog);

  // Data signals
  adverts = signal<Advert[]>([]);
  isLoading = signal(false);
  updatingIds = signal<Set<string>>(new Set());

  // Filters & Search
  searchQuery = signal<string>('');
  statusFilter = signal<string>('');

  // Pagination state
  currentPage = signal(1);
  limit = signal(10);
  totalAdverts = signal(0);
  totalPages = signal(1);
  hasPrev = signal(false);
  hasNext = signal(false);

  // Computed properties for UI
  showingFrom = computed(() => {
    if (this.totalAdverts() === 0) return 0;
    return (this.currentPage() - 1) * this.limit() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.limit(), this.totalAdverts());
  });

  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadAdverts();
  }

  loadAdverts(): void {
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

    this.advertService
      .getAllAdvertsInSystem(params)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const data = res.data || res;
          if (data) {
            this.adverts.set(data);

            // Map standard API pagination response
            if (res.pagination) {
              this.totalAdverts.set(res.pagination.totalCount || 0);
              this.totalPages.set(res.pagination.totalPages || 1);
              this.hasPrev.set(res.pagination.hasPrev || false);
              this.hasNext.set(res.pagination.hasNext || false);
            } else if (res.meta && res.meta.total !== undefined) {
              // Fallback map
              this.totalAdverts.set(res.meta.total);
            }
          }
        },
      });
  }

  // --- Filter Handlers ---

  onSearch(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchQuery.set(input);
    this.currentPage.set(1);
    this.loadAdverts();
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this.currentPage.set(1);
    this.loadAdverts();
  }

  onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.loadAdverts();
  }

  // --- Actions ---

  openAdvertDialog(id?: string): void {
    const dialogRef = this.dialog.open(AdvertFormComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      data: { id },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.loadAdverts();
      }
    });
  }

  toggleStatus(advert: Advert): void {
    const previousStatus = advert.status;
    const newStatus = advert.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    // 1. Optimistic UI Update & mark as updating
    this.adverts.update((currentAdverts) =>
      currentAdverts.map((a) => (a.id === advert.id ? { ...a, status: newStatus } : a)),
    );
    this.setUpdating(advert.id, true);

    // 2. Make the API Call
    this.advertService
      .togglePublishState(advert.id)
      .pipe(finalize(() => this.setUpdating(advert.id, false)))
      .subscribe({
        error: () => {
          // 3. Revert on failure
          this.adverts.update((currentAdverts) =>
            currentAdverts.map((a) => (a.id === advert.id ? { ...a, status: previousStatus } : a)),
          );
        },
      });
  }

  deleteAdvert(id: string): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Advertisement',
        message:
          'Are you sure you want to delete this advertisement? This action cannot be undone and will permanently remove associated media.',
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.setUpdating(id, true);
        this.advertService.deleteAdvert(id).subscribe({
          next: () => {
            this.loadAdverts();
          },
          error: () => {
            this.setUpdating(id, false);
          },
        });
      }
    });
  }


  isUpdating(id: string): boolean {
    return this.updatingIds().has(id);
  }

  private setUpdating(id: string, isUpdating: boolean): void {
    this.updatingIds.update((current) => {
      const updated = new Set(current);
      if (isUpdating) {
        updated.add(id);
      } else {
        updated.delete(id);
      }
      return updated;
    });
  }

  // --- Pagination Controls ---

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update((p) => p + 1);
      this.loadAdverts();
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.loadAdverts();
    }
  }
}
