import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { UserService, QueryParams } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { InitialsPipe } from '../../../core/pipe/initials.pipe';
import { FullNamePipe } from '../../../core/pipe/fullname.pipe';
import { MatDialog } from '@angular/material/dialog';
import { UserFormComponent } from '@app/views/private/forms/user-form/user-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { DeleteDialogData } from '@app/core/models/delete.interface';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [InitialsPipe, FullNamePipe, DatePipe, SlicePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);

  protected readonly users = signal<User[]>([]);
  protected readonly totalUsers = signal(0);
  protected readonly isLoading = signal(false);

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers(this.queryParams()).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data);
          this.totalUsers.set(response.pagination?.totalCount || response.data.length);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected onPageChange(page: number): void {
    this.queryParams.update((params) => ({ ...params, page }));
    this.loadUsers();
  }

  protected onCreate(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      data: { user: undefined },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadUsers();
    });
  }

  protected onEdit(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      data: { user },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadUsers();
    });
  }

  protected onDelete(user: User): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        entityName: 'User',
        title: 'Delete User?',
        message: 'Are you sure you want to delete "' + user.email + '"? This process is permanent.',
        deleteFn: () => this.userService.deleteUser(user.id),
      } as DeleteDialogData,
      disableClose: true,
      maxWidth: '500px',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadUsers();
    });
  }

  protected getRoleName(user: User): string {
    return user.roles?.[0]?.name || 'N/A';
  }
}
