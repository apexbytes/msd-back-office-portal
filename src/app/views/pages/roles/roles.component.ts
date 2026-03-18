import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RoleService, QueryParams } from '@/app/core/services/role.service';
import { Role } from '@/app/core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { RolesFormComponent } from '@app/views/pages/forms/roles-form/roles-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { DeleteDialogData } from '@app/core/models/delete.interface';

@Component({
  selector: 'app-roles',

  imports: [],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);

  protected readonly roles = signal<Role[]>([]);
  protected readonly totalCount = signal<number>(0);
  protected readonly isLoading = signal<boolean>(false);

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  ngOnInit(): void {
    this.fetchRoles();
  }

  protected fetchRoles(): void {
    this.isLoading.set(true);
    this.roleService.getAllRoles(this.queryParams()).subscribe({
      next: (response) => {
        if (response.success) {
          this.roles.set(response.data);
          this.totalCount.set(response.pagination?.totalCount || response.data.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
        this.isLoading.set(false);
      },
    });
  }

  protected onCreate(): void {
    const dialogRef = this.dialog.open(RolesFormComponent, {
      data: { role: undefined },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchRoles();
    });
  }

  protected onEdit(role: Role): void {
    const dialogRef = this.dialog.open(RolesFormComponent, {
      data: { role },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchRoles();
    });
  }

  protected onDelete(role: Role): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        entityName: 'Role',
        title: 'Delete Role?',
        message: 'Are you sure you want to delete "' + role.name + '"? This process is permanent.',
        deleteFn: () => this.roleService.deleteRole(role.id.toString()),
      } as DeleteDialogData,
      disableClose: true,
      maxWidth: '500px',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchRoles();
    });
  }

  protected getBadgeClass(type: string): string {
    switch (type.toUpperCase()) {
      case 'ADMIN':
        return 'badge-admin';
      case 'CLIENT':
        return 'badge-client';
      case 'USER':
      default:
        return 'badge-user';
    }
  }
}
