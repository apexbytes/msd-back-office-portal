import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { VehicleService } from '@app/core/services/vehicle.service';
import { LoadingService } from '@app/core/services/loading.service';
import { VehicleMake } from '@app/core/models/vehicle.model';
import { ModelDialogComponent } from '../model-dialog/model-dialog.component';
import { MakeFormComponent } from '@app/views/private/forms/make-form/make-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';

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
      },
    });
  }

  // --- Pagination Methods ---

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  // --- Actions ---

  protected onViewModels(make: VehicleMake): void {
    this.dialog.open(ModelDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: false,
      data: { make },
    });
  }

  protected onCreateMake(): void {
    const dialogRef = this.dialog.open(MakeFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMakes();
      }
    });
  }

  protected onEditMake(make: VehicleMake): void {
    const dialogRef = this.dialog.open(MakeFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: { make },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMakes();
      }
    });
  }

  protected onDeleteMake(make: VehicleMake): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Vehicle Make',
        message: `Are you sure you want to delete the make "${make.name}"? All associated models will also be deleted. This action cannot be undone.`,
        itemType: 'Make',
        itemName: make.name,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingService.show();
        this.vehicleService.deleteMake(make.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadMakes();
            }
            this.loadingService.hide();
          },
          error: (err) => {
            console.error(`Error deleting vehicle make: ${make.name}`, err);
            this.loadingService.hide();
          },
        });
      }
    });
  }
}
