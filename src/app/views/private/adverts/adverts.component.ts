import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, SlicePipe, CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AdvertFormComponent } from '@app/views/private/forms/advert-form/advert-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { AdvertService, QueryParams } from '@app/core/services/advert.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Advert } from '@app/core/models/advert.model';

@Component({
  selector: 'app-adverts',

  imports: [CommonModule, DatePipe, SlicePipe],
  templateUrl: './adverts.component.html',
  styleUrl: './adverts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly advertService = inject(AdvertService);
  private readonly loadingService = inject(LoadingService);

  protected readonly adverts = signal<Advert[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(false);

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  ngOnInit(): void {
    this.fetchAdverts();
  }

  protected fetchAdverts(): void {
    this.isLoading.set(true);
    this.advertService.getAdminAdverts(this.queryParams()).subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data;
          let advertsArray: Advert[] = [];

          if (Array.isArray(data)) {
            advertsArray = data;
          } else if (data && typeof data === 'object') {
            // Check for common nested property names
            if ('adverts' in data && Array.isArray((data as any).adverts)) {
              advertsArray = (data as any).adverts;
            } else if ('items' in data && Array.isArray((data as any).items)) {
              advertsArray = (data as any).items;
            }
          }

          this.adverts.set(advertsArray);
          this.totalCount.set(response.pagination?.totalCount || advertsArray.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching adverts:', err);
        this.isLoading.set(false);
      },
    });
  }

  protected onCreate(): void {
    const dialogRef = this.dialog.open(AdvertFormComponent, {
      data: { advert: undefined },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchAdverts();
    });
  }

  protected onEdit(advert: Advert): void {
    const dialogRef = this.dialog.open(AdvertFormComponent, {
      data: { advert },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchAdverts();
    });
  }

  protected onDelete(advert: Advert): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Advert',
        message: `Are you sure you want to delete the advert "${advert.title}"? This process is permanent and cannot be undone.`,
        itemType: 'Advert',
        itemName: advert.title,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingService.show();
        this.advertService.deleteAdvert(advert.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.fetchAdverts();
            }
            this.loadingService.hide();
          },
          error: (err) => {
            console.error(`Error deleting advert: ${advert.title}`, err);
            this.loadingService.hide();
          },
        });
      }
    });
  }

  protected onTogglePublish(advert: Advert): void {
    const newPublishState = !advert.published;
    this.loadingService.show();
    this.advertService.togglePublish(advert.id, newPublishState).subscribe({
      next: (response) => {
        if (response.success) {
          this.fetchAdverts();
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error toggling publish status:', err);
        this.fetchAdverts();
        this.loadingService.hide();
      },
    });
  }
}
