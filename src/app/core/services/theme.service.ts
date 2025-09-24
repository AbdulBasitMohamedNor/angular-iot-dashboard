import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _theme = signal<Theme>('auto');
  private _isDark = signal(false);

  public theme = this._theme.asReadonly();
  public isDark = this._isDark.asReadonly();

  constructor() {
    // Always force dark mode
    this.setTheme('dark');

    // Apply theme changes
    effect(() => {
      this.applyTheme();
    });
  }

  setTheme(_theme: Theme): void {
    // Always force dark mode regardless of input
    this._theme.set('dark');
    localStorage.setItem('theme', 'dark');
    this.updateDarkMode();
  }

  toggleTheme(): void {
    // Do nothing - theme is permanently dark
    return;
  }

  private updateDarkMode(): void {
    // Always dark mode
    this._isDark.set(true);
  }

  private applyTheme(): void {
    const isDark = this._isDark();
    
    // Apply to document
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
  }
}