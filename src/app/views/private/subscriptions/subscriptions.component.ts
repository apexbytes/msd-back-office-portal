import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionFormComponent } from '@app/views/private/forms/subscription-form/subscription-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { CustomDialogComponent } from '@app/views/shared/custom-dialog/custom-dialog.component';
import { DeleteDialogData } from '@app/core/models/delete.interface';
import { SubscriptionService } from '@app/core/services/subscription.service';
import { Subscription } from '@app/core/models/subscription.model';

@Component({
  selector: 'app-subscriptions',

  imports: [DatePipe, SlicePipe],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly subscriptionService = inject(SubscriptionService);

  protected readonly subscriptions = signal<Subscription[]>([]);
  protected readonly isLoading = signal(false);

  // Pagination Signals
  protected readonly currentPage = signal(1);
  protected readonly limit = signal(10);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly hasPrev = signal(false);

  ngOnInit(): void {
    this.fetchSubscriptions();
  }

  protected fetchSubscriptions(): void {
    this.isLoading.set(true);
    this.subscriptionService
      .getAllSubscriptions({ page: this.currentPage(), limit: this.limit() })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            let subs: Subscription[] = [];
            const data = response.data as any;

            if (Array.isArray(data)) {
              subs = data;
            } else if (typeof data === 'object') {
              subs = data.subscriptions || data.items || data.data || [];
            }

            this.subscriptions.set(subs);

            const pagination = response.pagination || data?.pagination;
            this.totalCount.set(pagination?.totalCount ?? subs.length);
            this.currentPage.set(pagination?.currentPage || 1);
            this.totalPages.set(
              pagination?.totalPages || Math.ceil(this.totalCount() / this.limit()),
            );
            this.hasNext.set(pagination?.hasNext || false);
            this.hasPrev.set(pagination?.hasPrev || false);
          } else {
            this.subscriptions.set([]);
            this.totalCount.set(0);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.subscriptions.set([]);
          this.totalCount.set(0);
          this.isLoading.set(false);
        },
      });
  }

  // --- Pagination Methods ---
  protected get showingFrom(): number {
    return this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.limit() + 1;
  }

  protected get showingTo(): number {
    return Math.min(this.currentPage() * this.limit(), this.totalCount());
  }

  protected nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update((p) => p + 1);
      this.fetchSubscriptions();
    }
  }

  protected prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update((p) => p - 1);
      this.fetchSubscriptions();
    }
  }

  protected onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limit.set(Number(select.value));
    this.currentPage.set(1);
    this.fetchSubscriptions();
  }

  protected onNotifyExpiring(): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      data: {
        title: 'Notify Expiring',
        message:
          'Are you sure you want to trigger email notifications for all subscriptions expiring within the next 7 days?',
        isConfirm: true,
        confirmText: 'Yes, Notify',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.subscriptionService.notifyExpiringSubscriptions().subscribe({
          next: (res) => {
            this.isLoading.set(false);
            this.dialog.open(CustomDialogComponent, {
              width: '400px',
              data: {
                title: 'Success',
                message: res.message || 'Expiration notifications triggered successfully.',
                isConfirm: false,
              },
            });
          },
          error: (err) => {
            console.error('Error triggering notifications:', err);
            this.isLoading.set(false);
            this.dialog.open(CustomDialogComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message: 'Failed to trigger expiration notifications.',
                isConfirm: false,
              },
            });
          },
        });
      }
    });
  }

  protected onCreate(): void {
    const dialogRef = this.dialog.open(SubscriptionFormComponent, {
      data: { subscription: undefined },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchSubscriptions();
    });
  }

  protected onEdit(subscription: Subscription): void {
    const dialogRef = this.dialog.open(SubscriptionFormComponent, {
      data: { subscription },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchSubscriptions();
    });
  }

  protected onCancel(subscription: Subscription): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        entityName: 'Subscription',
        title: 'Cancel Subscription?',
        message: `Are you sure you want to cancel the ${subscription.type} subscription for user ID: ${subscription.userId.slice(0, 8)}? This will revoke their upload access immediately.`,
        deleteFn: () =>
          this.subscriptionService.cancelSubscription(subscription.userId, subscription.type),
      } as DeleteDialogData,
      disableClose: true,
      maxWidth: '500px',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchSubscriptions();
    });
  }
}
