import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService } from '@app/core/services/vehicle.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Vehicle } from '@app/core/models/vehicle.model';
import { AdminStatusUpdateRequest } from '@app/core/dtos/requests/admin.request';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly loadingService = inject(LoadingService);

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(true);

  protected readonly updatingIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading.set(true);
    this.vehicleService.getAllVehiclesInSystem({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        const data = res.data?.vehicles || res.data || [];
        this.vehicles.set(data);
        this.totalCount.set(res.pagination?.totalCount || res.data?.totalCount || data.length);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading vehicles', err);
        this.isLoading.set(false);
      },
    });
  }

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
}
