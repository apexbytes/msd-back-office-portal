import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { RoleService } from '@app/core/services/role.service';
import { Role, Permission } from '@app/core/models/user.model';

@Component({
  selector: 'app-roles-form',

  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<RolesFormComponent>);
  protected readonly data = inject<{ role?: Role }>(MAT_DIALOG_DATA);

  protected readonly isEditMode = signal(!!this.data?.role);
  protected readonly isLoading = signal(false);
  protected readonly permissionsLoading = signal(true);

  protected readonly allPermissions = signal<Permission[]>([]);
  protected readonly isSuperAdmin = signal(false);

  protected roleForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadPermissions();
  }

  private initForm(): void {
    const role = this.data?.role;

    // Check if modifying SUPERADMIN to lock specific fields based on API rules
    this.isSuperAdmin.set(role?.name === 'SUPERADMIN');

    this.roleForm = this.fb.group({
      name: [{ value: role?.name || '', disabled: this.isSuperAdmin() }, [Validators.required]],
      type: [
        { value: role?.type || 'CUSTOM', disabled: this.isSuperAdmin() },
        [Validators.required],
      ],
      description: [role?.description || ''],
      // Map existing permissions to an array of just their IDs
      permissionIds: [role?.permissions?.map((p) => p.id) || []],
    });
  }

  private loadPermissions(): void {
    this.roleService
      .getAllPermissions()
      .pipe(finalize(() => this.permissionsLoading.set(false)))
      .subscribe({
        next: (res) => this.allPermissions.set(res.data),
        error: (err) => console.error('Failed to load permissions', err),
      });
  }

  protected isPermissionSelected(permId: number): boolean {
    const selected = this.roleForm.get('permissionIds')?.value as number[];
    return selected.includes(permId);
  }

  protected togglePermission(permId: number, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const selected = this.roleForm.get('permissionIds')?.value as number[];

    let newSelected;
    if (isChecked) {
      newSelected = [...selected, permId];
    } else {
      newSelected = selected.filter((id) => id !== permId);
    }

    this.roleForm.patchValue({ permissionIds: newSelected });
    this.roleForm.markAsDirty();
  }

  protected onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const roleData = this.roleForm.getRawValue();

    const request =
      this.isEditMode() && this.data?.role
        ? this.roleService.updateRole(this.data.role.id.toString(), roleData)
        : this.roleService.createRole(roleData);

    request.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (response) => {
        if (response.success) {
          this.dialogRef.close(response.data);
        }
      },
      error: (err) => {
        console.error(`Error ${this.isEditMode() ? 'updating' : 'creating'} role:`, err);
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }
}
