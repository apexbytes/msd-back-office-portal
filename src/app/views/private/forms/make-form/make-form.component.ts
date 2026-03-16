import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehicleService } from '@app/core/services/vehicle.service';
import { UploadService } from '@app/core/services/upload.service';
import { LoadingService } from '@app/core/services/loading.service';
import { VehicleMake } from '@app/core/models/vehicle.model';
import { FileUploadResult } from '@app/core/models/common.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-make-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './make-form.component.html',
  styleUrl: './make-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MakeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vehicleService = inject(VehicleService);
  private readonly uploadService = inject(UploadService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<MakeFormComponent>);
  protected readonly data = inject<{ make?: VehicleMake }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.make);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly globalLoading = this.loadingService.isLoading;

  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode() && this.data?.make) {
      this.patchForm(this.data.make);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      countryOfOrigin: [''],
      logoUrl: [null],
    });
  }

  private patchForm(make: VehicleMake): void {
    this.form.patchValue({
      name: make.name,
      countryOfOrigin: make.countryOfOrigin || '',
      logoUrl: make.logoUrl,
    });

    if (make.logoUrl?.url) {
      this.previewUrl.set(make.logoUrl.url);
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);

      this.isUploading.set(true);
      this.form.get('logoUrl')?.setErrors({ uploading: true });

      this.uploadService.uploadTemp(file).subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            const uploadedFile = response.data[0];
            const logoResult: FileUploadResult = {
              public_id: uploadedFile.public_id,
              url: uploadedFile.url,
              width: uploadedFile.width || 0,
              height: uploadedFile.height || 0,
              storageType: (uploadedFile.storageType as 'CLOUDINARY' | 'LOCAL') || 'CLOUDINARY',
            };
            this.form.patchValue({ logoUrl: logoResult });
            this.form.get('logoUrl')?.setErrors(null);
            this.form.get('logoUrl')?.markAsDirty();
          }
          this.isUploading.set(false);
        },
        error: (err) => {
          console.error('Logo upload failed', err);
          this.form.get('logoUrl')?.setErrors({ uploadFailed: true });
          this.isUploading.set(false);
        },
      });
    }
  }

  protected onRemoveLogo(): void {
    this.previewUrl.set(null);
    this.form.patchValue({ logoUrl: null });
    this.form.get('logoUrl')?.markAsDirty();
    const fileInput = document.getElementById('logoUrl') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isUploading()) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const makeData: any = {
      name: formValue.name,
    };

    if (formValue.countryOfOrigin && formValue.countryOfOrigin.trim() !== '') {
      makeData.countryOfOrigin = formValue.countryOfOrigin.trim();
    }

    if (this.form.get('logoUrl')?.dirty) {
      if (formValue.logoUrl) {
        makeData.logoUrl = formValue.logoUrl.public_id;
      } else {
        makeData.removeLogo = true;
      }
    } else if (!this.isEditMode()) {
      makeData.logoUrl = formValue.logoUrl?.public_id || null;
    }

    this.loadingService.show();

    const request$ =
      this.isEditMode() && this.data?.make?.id
        ? this.vehicleService.updateMake(this.data.make.id, makeData)
        : this.vehicleService.createMake(makeData);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          this.form.reset();
          const returnedData = response.data?.name || response.data;
          this.dialogRef.close(returnedData);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error handling make:', err);
        this.loadingService.hide();
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onReset(): void {
    this.form.reset();
    this.previewUrl.set(null);
    if (this.isEditMode() && this.data?.make) {
      this.patchForm(this.data.make);
    }
  }

  protected getFieldClass(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control && control.touched && control.invalid) {
      return 'error';
    }
    return '';
  }
}
