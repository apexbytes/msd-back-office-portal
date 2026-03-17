import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '@app/core/services/property.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Property } from '@app/core/models/property.model';
import { AdminStatusUpdateRequest } from '@app/core/dtos/requests/admin.request';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialog = inject(MatDialog);

  protected readonly properties = signal<Property[]>([]);
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
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.propertyService
      .getAllPropertiesInSystem({ page: this.currentPage(), limit: this.limit() })
      .subscribe({
        next: (res: any) => {
          const data = res.data?.properties || res.data || [];
          this.properties.set(data);

          const pagination = res.pagination || res.data?.pagination;
          this.totalCount.set(pagination?.totalCount || res.data?.totalCount || data.length);
          this.currentPage.set(pagination?.currentPage || 1);
          this.totalPages.set(
            pagination?.totalPages || Math.ceil(this.totalCount() / this.limit()),
          );
          this.hasNext.set(pagination?.hasNext || false);
          this.hasPrev.set(pagination?.hasPrev || false);

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading properties', err);
          this.isLoading.set(false);
        },
      });
  }

  protected get showingFrom(): number {
    return this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.limit() + 1;
  }

  protected get showingTo(): number {
    return Math.min(this.currentPage() * this.limit(), this.totalCount());
  }

  protected nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update((p) => p + 1);
      this.loadProperties();
    }
  }

  protected prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.loadProperties();
    }
  }

  protected onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.loadProperties();
  }

  private updatePropertyState(id: string, payload: AdminStatusUpdateRequest): void {
    const currentSet = new Set(this.updatingIds());
    currentSet.add(id);
    this.updatingIds.set(currentSet);

    this.propertyService.adminManageProperty(id, payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const updatedProperty = res.data;
          this.properties.update((props) =>
            props.map((p) => (p.id === id ? { ...p, ...updatedProperty } : p)),
          );
        }
        this.removeUpdatingId(id);
      },
      error: (err) => {
        console.error(`Failed to update property ${id}`, err);
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

  protected onTogglePublish(property: Property): void {
    if (property.status === 'ARCHIVED' || property.status === 'DELETED') return;

    const newStatus = property.status === 'DRAFT' ? 'AVAILABLE' : 'DRAFT';
    this.updatePropertyState(property.id, { status: newStatus as any });
  }

  protected onToggleFeature(property: Property, event: Event): void {
    event.preventDefault();
    this.updatePropertyState(property.id, { featured: !property.featured });
  }

  protected onBan(property: Property): void {
    this.updatePropertyState(property.id, { status: 'ARCHIVED' as any });
  }

  protected onUnban(property: Property): void {
    this.updatePropertyState(property.id, { status: 'DRAFT' as any });
  }

  protected onDelete(property: Property): void {
    const displayTitle = (property as any).title || (property as any).address || 'this property';

    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Property',
        message: `Are you sure you want to delete "${displayTitle}"? This process is permanent and cannot be undone.`,
        itemType: 'Property',
        itemName: displayTitle,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingService.show();
        this.propertyService.deleteProperty(property.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadProperties();
            }
            this.loadingService.hide();
          },
          error: (err: any) => {
            this.loadingService.hide();
          },
        });
      }
    });
  }
}
