import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TestimonialFormComponent } from '@app/views/private/forms/testimonial-form/testimonial-form.component';
import { DeleteDialogComponent } from '@app/views/shared/delete-dialog/delete-dialog.component';
import { DeleteDialogData } from '@app/core/models/delete.interface';
import { TestimonialService, QueryParams } from '@app/core/services/testimonial.service';
import { Testimonial } from '@app/core/models/testimonial.model';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly testimonialService = inject(TestimonialService);

  protected readonly testimonials = signal<Testimonial[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(false);

  protected readonly queryParams = signal<QueryParams>({
    page: 1,
    limit: 10,
  });

  ngOnInit(): void {
    this.fetchTestimonials();
  }

  protected fetchTestimonials(): void {
    this.isLoading.set(true);
    this.testimonialService.getAllTestimonialsInSystem(this.queryParams()).subscribe({
      next: (response) => {
        if (response.success) {
          this.testimonials.set(response.data);
          this.totalCount.set(response.pagination?.totalCount || response.data.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching testimonials:', err);
        this.isLoading.set(false);
      },
    });
  }

  protected onCreate(): void {
    const dialogRef = this.dialog.open(TestimonialFormComponent, {
      data: { testimonial: undefined },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchTestimonials();
    });
  }

  protected onEdit(testimonial: Testimonial): void {
    const dialogRef = this.dialog.open(TestimonialFormComponent, {
      data: { testimonial },
      disableClose: true,
      maxWidth: '1440px',
      maxHeight: '85vh',
      width: '90%',
      panelClass: 'full-screen-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchTestimonials();
    });
  }

  protected onDelete(testimonial: Testimonial): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        entityName: 'Testimonial',
        title: 'Delete Testimonial?',
        message: 'Are you sure you want to delete the testimonial from "' + testimonial.name + '"? This process is permanent.',
        deleteFn: () => this.testimonialService.deleteTestimonial(testimonial.id),
      } as DeleteDialogData,
      disableClose: true,
      maxWidth: '500px',
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchTestimonials();
    });
  }
}
