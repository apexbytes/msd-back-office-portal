import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TitleCasePipe } from '@angular/common';
import { PartnerFormComponent } from '@app/views/private/forms/partner-form/partner-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { PartnerService, QueryParams } from '@app/core/services/partner.service';
import { LoadingService } from '@app/core/services/loading.service';
import { Partner } from '@app/core/models/partner.model';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [TitleCasePipe],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnersComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly partnerService = inject(PartnerService);
  private readonly loadingService = inject(LoadingService);

  protected readonly partners = signal<Partner[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(false);

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  ngOnInit(): void {
    this.fetchPartners();
  }

  protected fetchPartners(): void {
    this.isLoading.set(true);
    this.partnerService.getAllPartners(this.queryParams()).subscribe({
      next: (response) => {
        if (response.success) {
          this.partners.set(response.data);
          this.totalCount.set(response.pagination?.totalCount || response.data.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching partners:', err);
        this.isLoading.set(false);
      },
    });
  }

  protected onCreate(): void {
    const dialogRef = this.dialog.open(PartnerFormComponent, {
      data: { partner: undefined },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchPartners();
    });
  }

  protected onEdit(partner: Partner): void {
    const dialogRef = this.dialog.open(PartnerFormComponent, {
      data: { partner },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchPartners();
    });
  }

  protected onDelete(partner: Partner): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'full-screen-modal',
      data: {
        title: 'Delete Partner',
        message: `Are you sure you want to delete the partner "${partner.name}"? This process is permanent and cannot be undone.`,
        itemType: 'Partner',
        itemName: partner.name,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingService.show();
        this.partnerService.deletePartner(partner.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.fetchPartners();
            }
            this.loadingService.hide();
          },
          error: (err) => {
            console.error(`Error deleting partner: ${partner.name}`, err);
            this.loadingService.hide();
          },
        });
      }
    });
  }
}
