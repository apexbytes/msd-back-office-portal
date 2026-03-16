import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionFormComponent } from '@app/views/private/forms/subscription-form/subscription-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { DeleteDialogData } from '@app/core/models/delete.interface';
import { SubscriptionService, QueryParams } from '@app/core/services/subscription.service';
import { of } from 'rxjs';
import { Subscription } from '@app/core/models/subscription.model';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [DatePipe, SlicePipe],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly subscriptionService = inject(SubscriptionService);

  protected readonly subscriptions = signal<Subscription[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(false);

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  ngOnInit(): void {
    this.fetchSubscriptions();
  }

  protected fetchSubscriptions(): void {
    this.isLoading.set(true);
    this.subscriptionService.getAllSubscriptions(this.queryParams()).subscribe({
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
          
          // Try to get totalCount from sibling pagination OR nested pagination OR array length
          const totalCount = response.pagination?.totalCount ?? data?.pagination?.totalCount ?? subs.length;
          this.totalCount.set(totalCount);
        } else {
          this.subscriptions.set([]);
          this.totalCount.set(0);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching subscriptions:', err);
        this.subscriptions.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
      },
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

  protected onDelete(subscription: Subscription): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        entityName: 'Subscription',
        title: 'Delete Subscription?',
        message: 'Are you sure you want to delete this subscription? This process is permanent.',
        deleteFn: () => {
          // No delete endpoint currently in SubscriptionService
          console.warn('No delete endpoint for subscriptions');
          return of({ success: false, message: 'Not implemented' });
        },
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
