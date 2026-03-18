import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { VehicleService } from '@app/core/services/vehicle.service';
import { VehicleMake, VehicleModel } from '@app/core/models/vehicle.model';
import { ModelFormComponent } from '../forms/model-form/model-form.component';
import { LoadingService } from '@app/core/services/loading.service';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-model-dialog',

  imports: [CommonModule],
  templateUrl: './model-dialog.component.html',
  styleUrl: './model-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDialogComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  protected readonly dialogRef = inject(MatDialogRef<ModelDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly loadingService = inject(LoadingService);

  public readonly data = inject<{ make: VehicleMake }>(MAT_DIALOG_DATA);

  protected readonly models = signal<VehicleModel[]>([]);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels(): void {
    this.isLoading.set(true);
    this.vehicleService.getModelsByMake(this.data.make.id).subscribe({
      next: (res: any) => {
        const data = res.data?.models || res.data || [];
        this.models.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(`Error loading models for ${this.data.make.name}`, err);
        this.isLoading.set(false);
      },
    });
  }

  protected closeDialog(): void {
    this.dialogRef.close();
  }

  protected onCreateModel(): void {
    const dialogRef = this.dialog.open(ModelFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: {
        makeId: this.data.make.id,
        makeName: this.data.make.name,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadModels();
      }
    });
  }

  protected onEditModel(model: VehicleModel): void {
    const dialogRef = this.dialog.open(ModelFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: {
        makeId: this.data.make.id,
        makeName: this.data.make.name,
        model: model,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadModels();
      }
    });
  }

  protected onDeleteModel(model: VehicleModel): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Vehicle Model',
        message: `Are you sure you want to delete the model "${model.name}"? This action cannot be undone.`,
        itemType: 'Model',
        itemName: model.name,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingService.show();
        this.vehicleService.deleteModel(model.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadModels();
            }
            this.loadingService.hide();
          },
          error: (err) => {
            console.error(`Error deleting vehicle model: ${model.name}`, err);
            this.loadingService.hide();
          },
        });
      }
    });
  }
}
