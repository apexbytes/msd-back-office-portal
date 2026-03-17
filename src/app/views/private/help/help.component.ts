import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;

  protected get isSuperAdmin(): boolean {
    const roles = this.currentUser()?.roles || [];
    return roles.some((r) => r.name === 'SUPERADMIN');
  }
}
