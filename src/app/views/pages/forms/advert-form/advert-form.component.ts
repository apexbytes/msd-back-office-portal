import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AdvertService } from '@app/core/services/advert.service';
import { UploadService } from '@app/core/services/upload.service';
import { Advert } from '@app/core/models/advert.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-advert-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './advert-form.component.html',
  styleUrls: ['./advert-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private advertService = inject(AdvertService);
  private uploadService = inject(UploadService);

  // Dialog Injections instead of Router
  private dialogRef = inject(MatDialogRef<AdvertFormComponent>);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  advertForm!: FormGroup;
  isEditMode = signal(false);
  advertId: string | null = null;
  isLoading = signal(false);
  isUploading = signal(false);

  uploadedImageUrl: string | null = null;
  uploadedImagePublicId: string | null = null;

  placements = [
    { value: 'IN_FEED', label: 'In Feed' },
    { value: 'HERO', label: 'Hero Banner' },
    { value: 'SIDEBAR', label: 'Sidebar' },
    { value: 'FOOTER', label: 'Footer' },
    { value: 'POPUP', label: 'Popup' },
  ];

  ngOnInit(): void {
    this.initForm();

    this.advertId = this.dialogData?.id || null;

    if (this.advertId) {
      this.isEditMode.set(true);
      this.loadAdvert(this.advertId);
    }
  }

  private initForm(): void {
    this.advertForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      targetUrl: ['', [Validators.pattern('https?://.+')]],
      placement: ['IN_FEED', [Validators.required]],
      startDate: [''],
      endDate: [''],
      metadataItems: this.fb.array([]),
    });
  }

  get metadataItems(): FormArray {
    return this.advertForm.get('metadataItems') as FormArray;
  }

  addMetadataField(key: string = '', value: string = ''): void {
    const group = this.fb.group({
      key: [key, Validators.required],
      value: [value, Validators.required],
    });
    this.metadataItems.push(group);
  }

  removeMetadataField(index: number): void {
    this.metadataItems.removeAt(index);
  }

  private loadAdvert(id: string): void {
    this.isLoading.set(true);
    this.advertService
      .getAdvertById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const ad = res.data || res;
          if (ad) {
            this.uploadedImageUrl = ad.imageUrl || null;

            this.advertForm.patchValue({
              title: ad.title,
              description: ad.description,
              targetUrl: ad.targetUrl,
              placement: ad.placement,
              startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
              endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
            });

            if (ad.metadata) {
              Object.entries(ad.metadata).forEach(([k, v]) => {
                if (k === 'public_id' || k === 'publicId') {
                  this.uploadedImagePublicId = String(v);
                } else {
                  this.addMetadataField(k, String(v));
                }
              });
            }
          }
        },
        error: () => {
          this.closeDialog(false);
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isUploading.set(true);

      this.uploadService
        .uploadTemp(file)
        .pipe(finalize(() => this.isUploading.set(false)))
        .subscribe({
          next: (res: any) => {
            const data = res.data || res;
            const uploadedFile = Array.isArray(data) ? data[0] : data;

            if (uploadedFile) {
              this.uploadedImageUrl = uploadedFile.url || uploadedFile.secure_url;
              this.uploadedImagePublicId = uploadedFile.public_id || uploadedFile.publicId;
            }
          },
        });
    }
  }

  onSubmit(): void {
    if (this.advertForm.invalid) {
      this.advertForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.advertForm.value;

    const metadataObj: Record<string, any> = {};
    formValue.metadataItems.forEach((item: any) => {
      if (item.key && item.value) {
        metadataObj[item.key] = item.value;
      }
    });

    if (this.uploadedImagePublicId) {
      metadataObj['public_id'] = this.uploadedImagePublicId;
    }

    const payload: Partial<Advert> = {
      title: formValue.title,
      description: formValue.description,
      targetUrl: formValue.targetUrl || '',
      placement: formValue.placement,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined,
      imageUrl: this.uploadedImageUrl || '',
      metadata: metadataObj,
    };

    const request$ = this.isEditMode()
      ? this.advertService.updateAdvert(this.advertId!, payload)
      : this.advertService.createAdvert(payload);

    request$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: () => {
        this.closeDialog(true);
      },
    });
  }

  closeDialog(success: boolean = false): void {
    this.dialogRef.close(success);
  }
}
