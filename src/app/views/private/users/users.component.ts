import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/core/services/user.service';
import { User } from '@app/core/models/user.model';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';
import { InitialsPipe } from '@app/core/pipe/initials.pipe';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserFormComponent } from '../forms/user-form/user-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { CustomDialogComponent } from '@app/views/shared/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, FullNamePipe, InitialsPipe, MatDialogModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);

  protected readonly users = signal<User[]>([]);
  protected readonly isLoading = signal(true);

  // Pagination State
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly limit = signal(20);

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal('');
  protected readonly roleFilter = signal('');

  // Debounce tracker
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.isLoading.set(true);

    const params = {
      page: this.currentPage(),
      limit: this.limit(),
      search: this.searchQuery() || undefined,
      status: this.statusFilter() || undefined,
      role: this.roleFilter() || undefined,
    };

    this.userService.getAllUsers(params).subscribe({
      next: (res: any) => {
        const data = res.data || {};

        // Ultra-resilient array extraction
        const items = data.users || data.items || (Array.isArray(data) ? data : (Array.isArray(res) ? res : []));
        this.users.set(items);

        // Update pagination signals based on metadata
        if (data.metadata) {
          this.currentPage.set(data.metadata.currentPage || 1);
          this.totalPages.set(data.metadata.totalPages || 1);
          this.totalCount.set(data.metadata.totalCount || 0);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading.set(false);
      },
    });
  }

  protected getAvatarUrl(avatar: any): string | null {
    if (!avatar) return null;
    if (typeof avatar === 'string') return avatar;
    return avatar.url || null;
  }

  // --- Filtering & Pagination ---
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);

    // Debounce the input by 400ms to prevent race conditions and DB spam
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadUsers();
    }, 400);
  }

  protected onFilterChange(type: 'status' | 'role', event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (type === 'status') this.statusFilter.set(select.value);
    if (type === 'role') this.roleFilter.set(select.value);

    this.currentPage.set(1);
    this.loadUsers();
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  // --- Dialog Integrations ---
  protected openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  protected openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: { user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (typeof result === 'object') {
          this.users.update((items) =>
            items.map((u) => (u.id === result.id ? { ...u, ...result } : u)),
          );
        } else {
          this.loadUsers();
        }
      }
    });
  }

  // --- Ban / Suspend User ---
  protected onBanUser(user: User): void {
    const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : user.companyName || user.email;

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: {
        title: 'Suspend Account',
        message: `Are you sure you want to suspend the account for <strong>${displayName}</strong>? They will be instantly logged out and prevented from accessing the system.`,
        confirmButtonText: 'Suspend User',
        cancelButtonText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.userService.updateUser(user.id, { status: 'SUSPENDED' }).subscribe({
          next: () => {
            this.users.update((items) => items.map((u) => (u.id === user.id ? { ...u, status: 'SUSPENDED' } : u)));
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Failed to suspend user', err);
            this.isLoading.set(false);
          },
        });
      }
    });
  }

  // --- Unlock User ---
  protected onUnlockUser(user: User): void {
    const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : user.companyName || user.email;

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: {
        title: 'Unlock Account',
        message: `Are you sure you want to restore access for <strong>${displayName}</strong>? This will remove all restrictions and reset any failed login attempts.`,
        confirmButtonText: 'Unlock User',
        cancelButtonText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        const request$ = (this.userService as any).unlockUser
          ? (this.userService as any).unlockUser(user.id)
          : this.userService.updateUser(user.id, { status: 'ACTIVE' });

        request$.subscribe({
          next: () => {
            this.users.update((items) => items.map((u) => (u.id === user.id ? { ...u, status: 'ACTIVE' } : u)));
            this.isLoading.set(false);
          },
          error: (err: any) => {
            console.error('Failed to unlock user', err);
            this.isLoading.set(false);
          },
        });
      }
    });
  }

  // --- Delete User ---
  protected onDeleteUser(user: User): void {
    const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : user.companyName || user.email;

    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: {
        title: 'Delete User',
        message: `Are you sure you want to permanently delete the account for <strong>${displayName}</strong>? This action cannot be undone.`,
        confirmButtonText: 'Delete User',
        cancelButtonText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update((items) => items.filter((u) => u.id !== user.id));
            if (this.users().length === 0 && this.currentPage() > 1) {
              this.currentPage.set(this.currentPage() - 1);
            }
            this.loadUsers();
          },
          error: (err) => {
            console.error('Failed to delete user', err);
            this.isLoading.set(false);
          },
        });
      }
    });
  }
}
