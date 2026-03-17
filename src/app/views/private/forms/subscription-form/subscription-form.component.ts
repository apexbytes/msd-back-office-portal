import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { SubscriptionService } from '@app/core/services/subscription.service';
import { LoadingService } from '@app/core/services/loading.service';
import { UserService } from '@app/core/services/user.service';
import { User } from '@app/core/models/user.model';
import { GrantSubscriptionRequest } from '@app/core/dtos/requests/admin.request';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';
import { Subscription } from '@app/core/models/subscription.model';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FullNamePipe],
  templateUrl: './subscription-form.component.html',
  styleUrl: './subscription-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly dialogRef = inject(MatDialogRef<SubscriptionFormComponent>);

  // Inputs for reusability
  subscription = input<Subscription | null>(null);
  userId = input<string | null>(null);

  // Outputs
  formSaved = output<boolean>();
  formCancelled = output<void>();

  // State Signals
  protected readonly isEditMode = signal(false);
  protected readonly globalLoading = this.loadingService.isLoading;
  protected readonly clientUsers = signal<User[]>([]);

  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadClientUsers();

    const sub = this.subscription();
    if (sub) {
      this.isEditMode.set(true);
      this.patchForm(sub);
    }
  }

  private loadClientUsers(): void {
    this.userService.getClientUsers({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          let usersArray = [];

          if (Array.isArray(res.data)) {
            usersArray = res.data;
          } else if (res.data.users && Array.isArray(res.data.users)) {
            usersArray = res.data.users;
          } else if (res.data.items && Array.isArray(res.data.items)) {
            usersArray = res.data.items;
          }

          this.clientUsers.set(usersArray);
        }
      },
      error: (err) => console.error('Failed to load client users:', err),
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      userId: [this.userId() || '', [Validators.required]],
      type: ['VEHICLE', [Validators.required]],
      durationMonths: [1, [Validators.required]],
      uploadLimit: [1, [Validators.required, Validators.min(1)]],
      isOverride: [false],
    });
  }

  private patchForm(sub: Subscription): void {
    this.form.patchValue({
      userId: sub.userId,
      type: sub.type,
      durationMonths: sub.durationMonths || 1,
      uploadLimit: sub.uploadLimit,
      isOverride: true,
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const targetUserId = formValue.userId;
    const payload: GrantSubscriptionRequest = {
      type: formValue.type,
      durationMonths: Number(formValue.durationMonths),
      uploadLimit: Number(formValue.uploadLimit),
    };

    this.loadingService.show();

    const request$ = formValue.isOverride
      ? this.subscriptionService.overrideSubscription(targetUserId, payload)
      : this.subscriptionService.grantSubscription(targetUserId, payload);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          this.form.reset();
          this.dialogRef.close(true);
        }
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error processing subscription:', err);
        this.loadingService.hide();
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onReset(): void {
    this.form.reset({
      type: 'VEHICLE',
      durationMonths: 1,
      uploadLimit: 1,
      userId: this.userId() || '',
      isOverride: false,
    });
    const sub = this.subscription();
    if (sub) {
      this.patchForm(sub);
    }
  }

  protected getFieldClass(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control && control.touched && control.invalid) {
      return 'error';
    }
    return '';
  }
}
