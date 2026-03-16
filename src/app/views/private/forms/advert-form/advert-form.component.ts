import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdvertService } from '@app/core/services/advert.service';
import { UploadService } from '@app/core/services/upload.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Advert } from '@app/core/models/advert.model';
import { FileUploadResult } from '@app/core/models/common.model';

@Component({
  selector: 'app-advert-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './advert-form.component.html',
  styleUrl: './advert-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly advertService = inject(AdvertService);
  private readonly uploadService = inject(UploadService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<AdvertFormComponent>);
  protected readonly data = inject<{ advert?: Advert }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.advert);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly globalLoading = this.loadingService.isLoading;
  
  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode() && this.data?.advert) {
      this.patchForm(this.data.advert);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      lifespanDays: [30, [Validators.required, Validators.min(1)]],
      published: [false],
      websiteUrl: [''],
      contactEmail: ['', [Validators.email]],
      media: [null, [Validators.required]]
    });
  }

  private patchForm(advert: Advert): void {
    this.form.patchValue({
      title: advert.title,
      description: advert.description,
      lifespanDays: advert.lifespanDays,
      published: advert.published,
      websiteUrl: advert.metadata?.websiteUrl || '',
      contactEmail: advert.metadata?.contactEmail || '',
      media: advert.media
    });

    if (advert.media?.url) {
      this.previewUrl.set(advert.media.url);
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
            const mediaResult: FileUploadResult = {
              public_id: uploadedFile.public_id,
              url: uploadedFile.url,
              width: uploadedFile.width,
              height: uploadedFile.height,
              storageType: uploadedFile.storageType as 'CLOUDINARY' | 'LOCAL'
            };
            this.form.patchValue({ media: mediaResult });
            this.form.get('media')?.markAsDirty();
          }
          this.isUploading.set(false);
          this.loadingService.hide();
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.isUploading.set(false);
          this.loadingService.hide();
        }
      });
    }
  }

  protected onRemoveImage(): void {
    this.previewUrl.set(null);
    this.form.patchValue({ media: null });
    this.form.get('media')?.markAsDirty();
    const fileInput = document.getElementById('media') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const advertData: Partial<Advert> = {
      title: formValue.title,
      description: formValue.description,
      lifespanDays: formValue.lifespanDays,
      published: formValue.published,
      media: formValue.media,
      metadata: {
        websiteUrl: formValue.websiteUrl,
        contactEmail: formValue.contactEmail
      }
    };

    this.loadingService.show();
    const request = (this.isEditMode() && this.data?.advert)
      ? this.advertService.updateAdvert(this.data.advert.id, advertData)
      : this.advertService.createAdvert(advertData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.form.reset();
          this.dialogRef.close(true);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error handling advert:', err);
        this.loadingService.hide();
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onReset(): void {
    this.form.reset({
      lifespanDays: 30,
      published: false
    });
    this.previewUrl.set(null);
    if (this.isEditMode() && this.data?.advert) {
      this.patchForm(this.data.advert);
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
