import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehicleService } from '@app/core/services/vehicle.service';
import { VehicleMake, VehicleModel } from '@app/core/models/vehicle.model';

@Component({
  selector: 'app-model-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-dialog.component.html',
  styleUrl: './model-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDialogComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  protected readonly dialogRef = inject(MatDialogRef<ModelDialogComponent>);

  // Retrieve the Make data passed from the parent component
  public readonly data = inject<{ make: VehicleMake }>(MAT_DIALOG_DATA);

  protected readonly models = signal<VehicleModel[]>([]);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels(): void {
    this.isLoading.set(true);
    // Fetch only the models belonging to the selected make
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

  // --- Placeholders for future CRUD ---
  protected onCreateModel(): void {
    console.log(`Open Create Model Form for ${this.data.make.name}`);
  }

  protected onEditModel(model: VehicleModel): void {
    console.log('Open Edit Model Form for', model.name);
  }

  protected onDeleteModel(model: VehicleModel): void {
    console.log('Open Delete Confirmation for', model.name);
  }
}
