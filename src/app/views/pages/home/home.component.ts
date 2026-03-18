import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '@app/core/services/stats.service';
import { AuthService } from '@app/core/services/auth.service';
import { FullNamePipe } from '@app/core/pipe/fullname.pipe';
import { InitialsPipe } from '@app/core/pipe/initials.pipe';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',

  imports: [CommonModule, FullNamePipe, InitialsPipe, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isLoading = signal<boolean>(true);
  protected readonly stats = signal<any>(null);

  ngOnInit(): void {
    this.fetchDashboardStats();
  }

  private fetchDashboardStats(): void {
    this.isLoading.set(true);
    this.statsService.getAdminStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin stats:', err);
        this.isLoading.set(false);
      },
    });
  }
}
