import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UploadService } from '../../../core/services/upload.service';
import { User } from '../../../core/models/user.model';
import { finalize } from 'rxjs/operators';
import { InitialsPipe } from '../../../core/pipe/initials.pipe';
import { FullNamePipe } from '../../../core/pipe/fullname.pipe';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, InitialsPipe, FullNamePipe],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  public uploadService = inject(UploadService);
  private destroyRef = inject(DestroyRef);

  profileForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  currentUser = this.authService.currentUser;
  tempAvatarUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      mobileNumber: [''],
      callNumber: [''],
      whatsappNumber: [''],
      useSameNumberForWhatsapp: [false],
      companyName: ['', [Validators.maxLength(100)]],
      bio: ['', [Validators.maxLength(500)]],
      city: ['', [Validators.maxLength(100)]],
      country: ['', [Validators.maxLength(100)]],
      avatar: [null],
      socialLinks: this.fb.group({
        website: [''],
        linkedIn: [''],
        x: [''],
        facebook: [''],
      }),
    });

    this.profileForm.disable();
  }

  private loadUserProfile(): void {
    this.isLoading.set(true);
    this.userService
      .getCurrentUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.patchForm(res.data);
          this.authService.updateUser(res.data);
        },
        error: (err) => console.error('Failed to load profile', err),
      });
  }

  private patchForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobileNumber: user.mobileNumber || '',
      callNumber: user.callNumber || '',
      whatsappNumber: user.whatsappNumber || '',
      useSameNumberForWhatsapp: user.useSameNumberForWhatsapp ?? false,
      companyName: user.companyName || '',
      bio: user.bio || '',
      city: user.city || '',
      country: user.country || '',
      socialLinks: {
        website: user.socialLinks?.website || '',
        linkedIn: user.socialLinks?.linkedIn || '',
        x: user.socialLinks?.x || '',
        facebook: user.socialLinks?.facebook || '',
      },
    });

    if (user.avatar && typeof user.avatar === 'object' && user.avatar.url) {
      this.tempAvatarUrl.set(user.avatar.url);
    } else {
      this.tempAvatarUrl.set(null);
    }
  }

  toggleMode(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isEditMode.set(isChecked);

    if (isChecked) {
      this.profileForm.enable();
    } else {
      this.profileForm.disable();
      if (this.currentUser()) {
        this.patchForm(this.currentUser()!);
      }
    }
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadService
      .uploadTempWithProgress(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data && res.data.length > 0) {
            const uploadedImage = res.data[0];
            this.tempAvatarUrl.set(uploadedImage.url);
            this.profileForm.patchValue({ avatar: uploadedImage.public_id });
            this.profileForm.get('avatar')?.markAsDirty();
            this.profileForm.get('avatar')?.markAsTouched();
          }
        },
        error: (err) => console.error('Upload failed', err),
      });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.profileForm.dirty) return;

    this.isSaving.set(true);
    const updatePayload = this.getDirtyValues(this.profileForm);

    this.userService
      .updateCurrentUser(updatePayload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.authService.updateUser(res.data);
          this.isEditMode.set(false);
          this.profileForm.disable();
          this.profileForm.markAsPristine();
        },
        error: (err) => console.error('Failed to update profile', err),
      });
  }

  private getDirtyValues(form: FormGroup): any {
    const dirtyValues: any = {};
    Object.keys(form.controls).forEach((key) => {
      const currentControl = form.controls[key];
      if (currentControl.dirty) {
        if (currentControl instanceof FormGroup) {
          dirtyValues[key] = this.getDirtyValues(currentControl);
        } else {
          dirtyValues[key] = currentControl.value;
        }
      }
    });
    return dirtyValues;
  }
}
