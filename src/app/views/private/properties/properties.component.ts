import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '@app/core/services/property.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Property } from '@app/core/models/property.model';
import { AdminStatusUpdateRequest } from '@app/core/dtos/requests/admin.request';

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

  protected readonly properties = signal<Property[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(true);

  protected readonly updatingIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.propertyService.getAllPropertiesInSystem({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        const data = res.data?.properties || res.data || [];
        this.properties.set(data);
        this.totalCount.set(res.pagination?.totalCount || res.data?.totalCount || data.length);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading properties', err);
        this.isLoading.set(false);
      },
    });
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
}
