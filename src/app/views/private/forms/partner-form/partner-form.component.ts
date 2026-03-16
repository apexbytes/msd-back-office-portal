import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PartnerService } from '@app/core/services/partner.service';
import { UploadService } from '@app/core/services/upload.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Partner } from '@app/core/models/partner.model';
import { FileUploadResult } from '@app/core/models/common.model';

@Component({
  selector: 'app-partner-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './partner-form.component.html',
  styleUrl: './partner-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly partnerService = inject(PartnerService);
  private readonly uploadService = inject(UploadService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<PartnerFormComponent>);
  protected readonly data = inject<{ partner?: Partner }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.partner);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly globalLoading = this.loadingService.isLoading;
  
  protected form!: FormGroup;

  protected readonly partnershipLevels = [
    { label: 'Premium', value: 'PREMIUM' },
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Basic', value: 'BASIC' }
  ];

  protected readonly statuses = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Archived', value: 'ARCHIVED' }
  ];

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode() && this.data?.partner) {
      this.patchForm(this.data.partner);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      website: ['', [Validators.pattern('https?://.+')]],
      partnershipLevel: ['STANDARD', [Validators.required]],
      status: ['ACTIVE', [Validators.required]],
      description: ['', [Validators.required]],
      logo: [null, [Validators.required]]
    });
  }

  private patchForm(partner: Partner): void {
    this.form.patchValue({
      name: partner.name,
      website: partner.website || '',
      partnershipLevel: partner.partnershipLevel,
      status: partner.status,
      description: partner.description,
      logo: partner.logo
    });

    if (partner.logo?.url) {
      this.previewUrl.set(partner.logo.url);
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
      this.loadingService.show();
      this.uploadService.uploadTemp(file).subscribe({
        next: (response) => {
          if (response.success && response.data.length > 0) {
            const uploadedFile = response.data[0];
            const logoResult: FileUploadResult = {
              public_id: uploadedFile.public_id,
              url: uploadedFile.url,
              width: uploadedFile.width,
              height: uploadedFile.height,
              storageType: uploadedFile.storageType as 'CLOUDINARY' | 'LOCAL'
            };
            this.form.patchValue({ logo: logoResult });
            this.form.get('logo')?.markAsDirty();
          }
          this.isUploading.set(false);
          this.loadingService.hide();
        },
        error: (err) => {
          console.error('Logo upload failed', err);
          this.isUploading.set(false);
          this.loadingService.hide();
        }
      });
    }
  }

  protected onRemoveLogo(): void {
    this.previewUrl.set(null);
    this.form.patchValue({ logo: null });
    this.form.get('logo')?.markAsDirty();
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const partnerData: Partial<Partner> = this.form.value;

    this.loadingService.show();
    const request = (this.isEditMode() && this.data?.partner)
      ? this.partnerService.updatePartner(this.data.partner.id, partnerData)
      : this.partnerService.createPartner(partnerData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.form.reset();
          this.dialogRef.close(true);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error handling partner:', err);
        this.loadingService.hide();
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onReset(): void {
    this.form.reset({
      partnershipLevel: 'STANDARD',
      status: 'ACTIVE'
    });
    this.previewUrl.set(null);
    if (this.isEditMode() && this.data?.partner) {
      this.patchForm(this.data.partner);
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