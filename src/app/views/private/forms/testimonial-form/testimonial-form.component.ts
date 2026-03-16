import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TestimonialService } from '@app/core/services/testimonial.service';
import { UploadService } from '@app/core/services/upload.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Testimonial } from '@app/core/models/testimonial.model';
import { FileUploadResult } from '@app/core/models/common.model';

@Component({
  selector: 'app-testimonial-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './testimonial-form.component.html',
  styleUrl: './testimonial-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly testimonialService = inject(TestimonialService);
  private readonly uploadService = inject(UploadService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<TestimonialFormComponent>);
  protected readonly data = inject<{ testimonial?: Testimonial }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.testimonial);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly globalLoading = this.loadingService.isLoading;

  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode() && this.data?.testimonial) {
      this.patchForm(this.data.testimonial);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      designation: [''],
      company: [''],
      message: ['', [Validators.required, Validators.minLength(10)]],
      image: [null, [Validators.required]],
      rating: [5, [Validators.min(1), Validators.max(5)]],
      featured: [false],
      sortOrder: [0, [Validators.min(0)]]
    });
  }

  private patchForm(testimonial: Testimonial): void {
    this.form.patchValue({
      name: testimonial.name,
      designation: testimonial.designation || '',
      company: testimonial.company || '',
      message: testimonial.message,
      image: testimonial.image,
      rating: testimonial.rating || 5,
      featured: testimonial.featured || false,
      sortOrder: testimonial.sortOrder || 0
    });

    if (testimonial.image?.url) {
      this.previewUrl.set(testimonial.image.url);
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
            const imageResult: FileUploadResult = {
              public_id: uploadedFile.public_id,
              url: uploadedFile.url,
              width: uploadedFile.width,
              height: uploadedFile.height,
              storageType: uploadedFile.storageType as 'CLOUDINARY' | 'LOCAL'
            };
            this.form.patchValue({ image: imageResult });
            this.form.get('image')?.markAsDirty();
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
    this.form.patchValue({ image: null });
    this.form.get('image')?.markAsDirty();
    const fileInput = document.getElementById('image') as HTMLInputElement;
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
    const testimonialData: Partial<Testimonial> = {
      name: formValue.name,
      designation: formValue.designation || undefined,
      company: formValue.company || undefined,
      message: formValue.message,
      image: formValue.image,
      rating: formValue.rating,
      featured: formValue.featured,
      sortOrder: formValue.sortOrder
    };

    this.loadingService.show();
    const request = (this.isEditMode() && this.data?.testimonial)
      ? this.testimonialService.updateTestimonial(this.data.testimonial.id, testimonialData)
      : this.testimonialService.createTestimonial(testimonialData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.form.reset();
          this.dialogRef.close(true);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error(`Error ${this.isEditMode() ? 'updating' : 'creating'} testimonial:`, err);
        this.loadingService.hide();
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onReset(): void {
    this.form.reset({
      rating: 5,
      featured: false,
      sortOrder: 0
    });
    this.previewUrl.set(null);
    if (this.isEditMode() && this.data?.testimonial) {
      this.patchForm(this.data.testimonial);
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
