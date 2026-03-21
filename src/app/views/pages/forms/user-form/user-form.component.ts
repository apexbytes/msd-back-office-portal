import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@app/core/services/user.service';
import { RoleService } from '@app/core/services/role.service';
import { UploadService } from '@app/core/services/upload.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  protected readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  public readonly data = inject<any>(MAT_DIALOG_DATA);

  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly uploadService = inject(UploadService);

  // State Signals
  protected isSubmitting = signal(false);
  protected availableRoles = signal<any[]>([]);

  // Upload Signals mapped from service
  protected isUploading = this.uploadService.isUploading;
  protected uploadProgress = this.uploadService.uploadProgress;

  protected newTempAvatarId: string | null = null;

  protected user = {
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    mobileNumber: '',
    callNumber: '',
    whatsappNumber: '',
    useSameNumberForWhatsapp: false,
    city: '',
    country: '',
    bio: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED',
    avatar: null as any,
    socialLinks: {
      website: '',
      facebook: '',
      x: '',
      linkedIn: '',
      instagram: '',
    },
  };
  protected selectedRoleId = '';

  ngOnInit(): void {
    this.loadRoles();

    if (this.data?.user) {
      this.user = {
        ...this.user,
        ...this.data.user,
        useSameNumberForWhatsapp: this.data.user.useSameNumberForWhatsapp ?? false,
        socialLinks: this.data.user.socialLinks || {
          website: '',
          facebook: '',
          x: '',
          linkedIn: '',
          instagram: '',
        },
      };

      if (this.data.user.roles && this.data.user.roles.length > 0) {
        this.selectedRoleId = this.data.user.roles[0].id;
      }
    }
  }

  private loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (res: any) => {
        const roles = res.data?.roles || res.data || [];
        this.availableRoles.set(Array.isArray(roles) ? roles : []);
      },
      error: (err) => console.error('Failed to load roles', err),
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.uploadService.uploadTempWithProgress(file).subscribe({
        next: (res) => {
          if (res.success && res.data && res.data.length > 0) {
            this.user.avatar = res.data[0];
            this.newTempAvatarId = res.data[0].public_id;
          }
        },
        error: (err) => {
          console.error('Avatar upload failed', err);
          this.uploadService.resetProgress();
        },
      });
    }
  }

  protected getAvatarUrl(): string | null {
    if (!this.user.avatar) return null;
    return typeof this.user.avatar === 'string' ? this.user.avatar : this.user.avatar.url;
  }

  protected closeDialog(result?: any): void {
    this.uploadService.resetProgress();
    this.dialogRef.close(result);
  }

  protected onSubmit(): void {
    this.isSubmitting.set(true);

    const payload: any = {
      ...this.user,
      roleIds: [Number(this.selectedRoleId)],
    };

    if (this.newTempAvatarId) {
      payload.avatar = this.newTempAvatarId;
    } else {
      delete payload.avatar;
    }

    const request$ = this.data?.user
      ? this.userService.updateUser(this.data.user.id, payload)
      : this.userService.createUser(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.closeDialog(res.data || true);
      },
      error: (err) => {
        console.error('Failed to save user', err);
        this.isSubmitting.set(false);
      },
    });
  }
}
