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
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('auto');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this._theme() === 'auto') {
        this._isDark.set(e.matches);
        this.applyTheme();
      }
    });

    // Apply theme changes
    effect(() => {
      this.applyTheme();
    });
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.updateDarkMode();
  }

  toggleTheme(): void {
    const current = this._theme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('auto');
    } else {
      // If auto, toggle to light
      this.setTheme('light');
    }
  }

  private updateDarkMode(): void {
    const theme = this._theme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'auto') {
      isDark = prefersDark;
    }

    this._isDark.set(isDark);
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