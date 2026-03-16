import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@app/core/services/user.service';
import { UploadService } from '@app/core/services/upload.service';
import { LoadingService } from '@app/core/services/loading.service';
import { User } from '@app/core/models/user.model';
import { FileUploadResult } from '@app/core/models/common.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly uploadService = inject(UploadService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  protected readonly data = inject<{ user?: User }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.user);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly globalLoading = this.loadingService.isLoading;

  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode() && this.data?.user) {
      this.patchForm(this.data.user);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: [''],
      lastName: [''],
      companyName: [''],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: [''],
      bio: [''],
      city: [''],
      country: [''],
      avatar: [null],
      socialLinks: this.fb.group({
        website: [''],
        facebook: [''],
        x: [''],
        linkedIn: [''],
        instagram: ['']
      })
    });
  }

  private patchForm(user: User): void {
    this.form.patchValue({
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      email: user.email,
      mobileNumber: user.mobileNumber || '',
      bio: user.bio || '',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar,
      socialLinks: {
        website: user.socialLinks?.website || '',
        facebook: user.socialLinks?.facebook || '',
        x: user.socialLinks?.x || '',
        linkedIn: user.socialLinks?.linkedIn || '',
        instagram: user.socialLinks?.instagram || ''
      }
    });

    if (user.avatar?.url) {
      this.previewUrl.set(user.avatar.url);
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
            const avatarResult: FileUploadResult = {
              public_id: uploadedFile.public_id,
              url: uploadedFile.url,
              width: uploadedFile.width,
              height: uploadedFile.height,
              storageType: uploadedFile.storageType as 'CLOUDINARY' | 'LOCAL'
            };
            this.form.patchValue({ avatar: avatarResult });
            this.form.get('avatar')?.markAsDirty();
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
    this.form.patchValue({ avatar: null });
    this.form.get('avatar')?.markAsDirty();
    const fileInput = document.getElementById('avatar') as HTMLInputElement;
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
    const userData: Partial<User> = {
      username: formValue.username,
      firstName: formValue.firstName || undefined,
      lastName: formValue.lastName || undefined,
      companyName: formValue.companyName || undefined,
      email: formValue.email,
      mobileNumber: formValue.mobileNumber || undefined,
      bio: formValue.bio || undefined,
      city: formValue.city || undefined,
      country: formValue.country || undefined,
      avatar: formValue.avatar,
      socialLinks: {
        website: formValue.socialLinks.website || undefined,
        facebook: formValue.socialLinks.facebook || undefined,
        x: formValue.socialLinks.x || undefined,
        linkedIn: formValue.socialLinks.linkedIn || undefined,
        instagram: formValue.socialLinks.instagram || undefined
      }
    };

    this.loadingService.show();
    const request = (this.isEditMode() && this.data?.user)
      ? this.userService.updateUser(this.data.user.id, userData)
      : this.userService.createUser(userData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.form.reset();
          this.dialogRef.close(true);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error handling user:', err);
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
    if (this.isEditMode() && this.data?.user) {
      this.patchForm(this.data.user);
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
