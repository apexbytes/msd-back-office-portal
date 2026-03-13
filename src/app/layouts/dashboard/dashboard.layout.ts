import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/app/core/services/auth.service';
import { FullNamePipe } from '@/app/core/pipe/fullname.pipe';
import { InitialsPipe } from '@/app/core/pipe/initials.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FullNamePipe,
    InitialsPipe,
  ],
  templateUrl: './dashboard.layout.html',
  styleUrl: './dashboard.layout.css',
})
export class DashboardLayout {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  isUserMenuOpen = false;

  @HostListener('document:click')
  clickout() {
    this.closeUserMenu();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  logout() {
    this.authService.logout();
  }
}
