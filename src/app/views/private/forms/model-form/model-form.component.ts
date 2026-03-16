import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehicleService } from '@app/core/services/vehicle.service';
import { LoadingService } from '@app/core/services/loading.service';
import { VehicleModel } from '@app/core/models/vehicle.model';
import { NgClass } from '@angular/common';

export interface ModelFormData {
  makeId: string;
  makeName: string;
  model?: VehicleModel;
}

@Component({
  selector: 'app-model-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './model-form.component.html',
  styleUrl: './model-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vehicleService = inject(VehicleService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<ModelFormComponent>);

  public readonly data = inject<ModelFormData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.model);
  protected readonly globalLoading = this.loadingService.isLoading;

  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode() && this.data?.model) {
      this.patchForm(this.data.model);
    }
  }

  private initForm(): void {
    const currentYear = new Date().getFullYear() + 1;

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      year: [null, [Validators.min(1886), Validators.max(currentYear)]],
      bodyStyles: [''],
    });
  }

  private patchForm(model: VehicleModel): void {
    this.form.patchValue({
      name: model.name,
      year: model.year,
      bodyStyles: model.bodyStyles ? model.bodyStyles.join(', ') : '',
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const apiPayload: any = {
      makeId: this.data.makeId,
      name: formValue.name.trim(),
    };

    if (formValue.year) {
      apiPayload.year = Number(formValue.year);
    }

    if (formValue.bodyStyles && formValue.bodyStyles.trim() !== '') {
      apiPayload.bodyStyle = formValue.bodyStyles.trim();
    }

    this.loadingService.show();

    const request$ =
      this.isEditMode() && this.data?.model?.id
        ? this.vehicleService.updateModel(this.data.model.id, apiPayload)
        : this.vehicleService.createModel(apiPayload);

    request$.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.form.reset();
          const returnedData = response.data?.model || response.data;
          this.dialogRef.close(returnedData);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error handling model:', err);
        this.loadingService.hide();
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected getFieldClass(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control && control.touched && control.invalid) {
      return 'error';
    }
    return '';
  }
}
