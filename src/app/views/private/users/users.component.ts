import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@/app/core/services/user.service';
import { User } from '@/app/core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { UserFormComponent } from '@app/views/private/forms/user-form/user-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { DeleteDialogData } from '@app/core/models/delete.interface';
import { LoadingService } from '@app/core/services/loading.service';
import { QueryParams } from '@app/core/services/role.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialog = inject(MatDialog);

  protected readonly users = signal<User[]>([]);
  protected readonly totalCount = signal<number>(0);
  protected readonly isLoading = signal<boolean>(false);

  // Track which rows are currently being updated
  protected readonly updatingIds = signal<Set<string>>(new Set());

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  // Calculate total pages for UI
  protected readonly totalPages = computed(() => {
    return Math.ceil(this.totalCount() / (this.queryParams().limit || 10)) || 1;
  });

  ngOnInit(): void {
    this.fetchUsers();
  }

  protected fetchUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers(this.queryParams()).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data);
          this.totalCount.set(response.pagination?.totalCount || response.data.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.isLoading.set(false);
      },
    });
  }

  // --- Pagination ---

  protected nextPage(): void {
    if ((this.queryParams().page || 1) < this.totalPages()) {
      this.queryParams.update((params) => ({ ...params, page: (params.page || 1) + 1 }));
      this.fetchUsers();
    }
  }

  protected prevPage(): void {
    if ((this.queryParams().page || 1) > 1) {
      this.queryParams.update((params) => ({ ...params, page: (params.page || 1) - 1 }));
      this.fetchUsers();
    }
  }

  // --- Utility for Inline Actions ---

  protected isUpdating(id: string): boolean {
    return this.updatingIds().has(id);
  }

  private setUpdating(id: string, isUpdating: boolean): void {
    const currentSet = new Set(this.updatingIds());
    if (isUpdating) currentSet.add(id);
    else currentSet.delete(id);
    this.updatingIds.set(currentSet);
  }

  // --- CRUD Actions ---

  protected onCreate(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      data: { user: undefined },
      disableClose: true,
      maxWidth: '1000px',
      maxHeight: '90vh',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchUsers();
    });
  }

  protected onEdit(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      data: { user },
      disableClose: true,
      maxWidth: '1000px',
      maxHeight: '90vh',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchUsers();
    });
  }

  protected onDelete(user: User): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        entityName: 'User',
        title: 'Delete User?',
        message: `Are you sure you want to permanently delete "${user.username}"? This action cannot be undone.`,
        deleteFn: () => this.userService.deleteUser(user.id),
      } as DeleteDialogData,
      disableClose: true,
      maxWidth: '500px',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchUsers();
    });
  }

  // --- Quick Actions ---

  protected onBanUser(user: User): void {
    this.setUpdating(user.id, true);
    // Banning a user sets their status to SUSPENDED
    this.userService.updateUser(user.id, { status: 'SUSPENDED' }).subscribe({
      next: (res) => {
        if (res.success) this.fetchUsers();
        this.setUpdating(user.id, false);
      },
      error: (err) => {
        console.error('Failed to ban user', err);
        this.setUpdating(user.id, false);
      },
    });
  }

  protected onUnlockUser(user: User): void {
    this.setUpdating(user.id, true);
    // Re-activating a suspended or inactive user
    this.userService.updateUser(user.id, { status: 'ACTIVE' }).subscribe({
      next: (res) => {
        if (res.success) this.fetchUsers();
        this.setUpdating(user.id, false);
      },
      error: (err) => {
        console.error('Failed to unlock user', err);
        this.setUpdating(user.id, false);
      },
    });
  }

  protected getBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'badge-active';
      case 'SUSPENDED':
        return 'badge-danger';
      case 'INACTIVE':
        return 'badge-inactive';
      default:
        return 'badge-outline';
    }
  }
}
