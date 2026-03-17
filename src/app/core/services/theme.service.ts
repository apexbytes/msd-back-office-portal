import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  // Signal holding the current theme state
  public readonly isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.listenForSystemChanges();
    }

    // Effect: Automatically update the <body> class whenever the signal changes
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.isDark()) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }
    });
  }

  private initializeTheme(): void {
    const storedTheme = localStorage.getItem('app-theme');

    if (storedTheme) {
      // Use user's saved preference
      this.isDark.set(storedTheme === 'dark');
    } else {
      // Fall back to the device's OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }
  }

  private listenForSystemChanges(): void {
    // Listen for changes if the user switches their OS theme while the app is open
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if the user hasn't explicitly saved a manual preference
      if (!localStorage.getItem('app-theme')) {
        this.isDark.set(e.matches);
      }
    });
  }

  public toggleTheme(): void {
    const newTheme = !this.isDark();
    this.isDark.set(newTheme);
    localStorage.setItem('app-theme', newTheme ? 'dark' : 'light');
  }
}
