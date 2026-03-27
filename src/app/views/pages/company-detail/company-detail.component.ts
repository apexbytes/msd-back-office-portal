import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MusondosiService } from '../../../core/services/musondosi.service';
import { MusondosiDetails } from '../../../core/models/musondosi.model';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.css',
})
export class CompanyDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private musondosiService = inject(MusondosiService);
  private destroyRef = inject(DestroyRef);

  companyForm!: FormGroup;
  details = signal<MusondosiDetails | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
    this.loadDetails();
  }

  private initForm(): void {
    this.companyForm = this.fb.group({
      supportEmail: ['', [Validators.email]],
      businessEmail: ['', [Validators.email]],
      supportPhone: [''],
      supportWhatsapp: [''],
      supportSignal: [''],
      ecocashDetails: this.fb.group({
        accountNumber: [''],
        accountName: [''],
      }),
      bankDetails: this.fb.group({
        accountNumber: [''],
        accountName: [''],
        bankName: [''],
        branchName: [''],
      }),
      facebookLink: [''],
      instagramLink: [''],
      twitterLink: [''],
      tiktokLink: [''],
      youtubeLink: [''],
    });

    this.companyForm.disable();
  }

  private loadDetails(): void {
    this.isLoading.set(true);
    this.musondosiService
      .getDetails()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.details.set(res.data);
            this.patchForm(res.data);
          }
        },
        error: (err) => {
          console.error('Failed to load company details', err);
        },
      });
  }

  private patchForm(data: MusondosiDetails): void {
    this.companyForm.patchValue({
      supportEmail: data.supportEmail || '',
      businessEmail: data.businessEmail || '',
      supportPhone: data.supportPhone || '',
      supportWhatsapp: data.supportWhatsapp || '',
      supportSignal: data.supportSignal || '',
      ecocashDetails: {
        accountNumber: data.ecocashDetails?.accountNumber || '',
        accountName: data.ecocashDetails?.accountName || '',
      },
      bankDetails: {
        accountNumber: data.bankDetails?.accountNumber || '',
        accountName: data.bankDetails?.accountName || '',
        bankName: data.bankDetails?.bankName || '',
        branchName: data.bankDetails?.branchName || '',
      },
      facebookLink: data.facebookLink || '',
      instagramLink: data.instagramLink || '',
      twitterLink: data.twitterLink || '',
      tiktokLink: data.tiktokLink || '',
      youtubeLink: data.youtubeLink || '',
    });
  }

  toggleEdit(): void {
    this.isEditMode.set(!this.isEditMode());
    if (this.isEditMode()) {
      this.companyForm.enable();
    } else {
      this.companyForm.disable();
      if (this.details()) {
        this.patchForm(this.details()!);
      } else {
        this.companyForm.reset();
      }
    }
  }

  onSubmit(): void {
    if (this.companyForm.invalid) return;

    this.isSaving.set(true);
    const payload = this.companyForm.value;
    const currentDetails = this.details();

    const request = currentDetails?.id
      ? this.musondosiService.updateDetails(currentDetails.id, payload)
      : this.musondosiService.createDetails(payload);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.details.set(res.data);
            this.patchForm(res.data);
            this.isEditMode.set(false);
            this.companyForm.disable();
          }
        },
        error: (err) => {
          console.error('Failed to save company details', err);
        },
      });
  }
}
