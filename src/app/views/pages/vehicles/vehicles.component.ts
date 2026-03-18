import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService } from '@app/core/services/vehicle.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Vehicle } from '@app/core/models/vehicle.model';
import { AdminStatusUpdateRequest } from '@app/core/dtos/requests/admin.request';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-vehicles',

  imports: [CommonModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialog = inject(MatDialog);

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly updatingIds = signal<Set<string>>(new Set());

  // Search and Filter Signals
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal('');

  // Pagination Signals
  protected readonly currentPage = signal(1);
  protected readonly limit = signal(10);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly hasPrev = signal(false);

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.limit(),
    };

    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }

    if (this.statusFilter()) {
      params.status = this.statusFilter();
    }

    this.vehicleService
      .getAllVehiclesInSystem(params)
      .subscribe({
        next: (res: any) => {
          const data = res.data?.vehicles || res.data || [];
          this.vehicles.set(data);

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
          console.error('Error loading vehicles', err);
          this.isLoading.set(false);
        },
      });
  }

  // --- Filter Methods ---
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
    this.loadVehicles();
  }

  protected onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this.currentPage.set(1);
    this.loadVehicles();
  }
  // ----------------------

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
      this.loadVehicles();
    }
  }

  protected prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.loadVehicles();
    }
  }

  protected onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.loadVehicles();
  }
  // --------------------------

  private updateVehicleState(id: string, payload: AdminStatusUpdateRequest): void {
    const currentSet = new Set(this.updatingIds());
    currentSet.add(id);
    this.updatingIds.set(currentSet);

    this.vehicleService.adminManageVehicle(id, payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const updatedVehicle = res.data;
          this.vehicles.update((items) =>
            items.map((v) => (v.id === id ? { ...v, ...updatedVehicle } : v)),
          );
        }
        this.removeUpdatingId(id);
      },
      error: (err) => {
        console.error(`Failed to update vehicle ${id}`, err);
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

  protected onTogglePublish(vehicle: Vehicle): void {
    if (vehicle.status === 'DELETED') return;

    // Publish it by making it FOR_SALE. Otherwise, unpublish to DRAFT.
    const newStatus = vehicle.status === 'DRAFT' ? 'FOR_SALE' : 'DRAFT';
    this.updateVehicleState(vehicle.id, { status: newStatus as any });
  }

  protected onToggleFeature(vehicle: Vehicle, event: Event): void {
    event.preventDefault();
    this.updateVehicleState(vehicle.id, { featured: !vehicle.featured });
  }

  protected onBan(vehicle: Vehicle): void {
    this.updateVehicleState(vehicle.id, { status: 'DELETED' as any });
  }

  protected onUnban(vehicle: Vehicle): void {
    this.updateVehicleState(vehicle.id, { status: 'DRAFT' as any });
  }

  protected onDelete(vehicle: Vehicle): void {
    const displayTitle = (vehicle as any).title || (vehicle as any).name || 'this vehicle';

    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Vehicle',
        message: `Are you sure you want to delete "${displayTitle}"? This process is permanent and cannot be undone.`,
        itemType: 'Vehicle',
        itemName: displayTitle,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingService.show();
        this.vehicleService.deleteVehicle(vehicle.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadVehicles();
            }
            this.loadingService.hide();
          },
          error: (err: any) => {
            console.error(`Error deleting vehicle:`, err);
            this.loadingService.hide();
          },
        });
      }
    });
  }
}
