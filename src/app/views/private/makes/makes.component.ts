import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { VehicleService } from '@app/core/services/vehicle.service';
import { LoadingService } from '@app/core/services/loading.service';
import { VehicleMake } from '@app/core/models/vehicle.model';
import { ModelDialogComponent } from '../model-dialog/model-dialog.component';

@Component({
  selector: 'app-makes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './makes.component.html',
  styleUrl: './makes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MakesComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialog = inject(MatDialog);

  // --- Data State ---
  protected readonly allMakes = signal<VehicleMake[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(true);

  // --- Pagination State ---
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  // Automatically recalculate the displayed subset when page or data changes
  protected readonly paginatedMakes = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.allMakes().slice(start, end);
  });

  // Automatically calculate total pages
  protected readonly totalPages = computed(() => {
    return Math.ceil(this.totalCount() / this.pageSize()) || 1;
  });

  ngOnInit(): void {
    this.loadMakes();
  }

  loadMakes(): void {
    this.isLoading.set(true);
    this.vehicleService.getAllMakes().subscribe({
      next: (res: any) => {
        const data = res.data?.makes || res.data || [];
        this.allMakes.set(data);
        this.totalCount.set(data.length);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading vehicle makes', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- Pagination Methods ---

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  // --- Actions ---

  protected onViewModels(make: VehicleMake): void {
    this.dialog.open(ModelDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: false,
      data: { make }
    });
  }

  protected onCreateMake(): void {
    console.log('Open Create Make Form');
  }

  protected onEditMake(make: VehicleMake): void {
    console.log('Open Edit Make Form for', make.name);
  }

  protected onDeleteMake(make: VehicleMake): void {
    console.log('Open Delete Confirmation for', make.name);
  }
}
