import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoleService } from '@app/core/services/role.service';
import { Role } from '@app/core/models/user.model';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [],
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesFormComponent {
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<RolesFormComponent>);
  protected readonly data = inject<{ role?: Role }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.role);
  protected readonly isLoading = signal(false);

  protected onSubmit(roleData: Partial<Role>): void {
    this.isLoading.set(true);
    const request = (this.isEditMode() && this.data?.role)
      ? this.roleService.updateRole(this.data.role.id.toString(), roleData)
      : this.roleService.createRole(roleData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.dialogRef.close(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(`Error ${this.isEditMode() ? 'updating' : 'creating'} role:`, err);
        this.isLoading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }
}
