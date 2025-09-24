import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private themeService = inject(ThemeService);
  
  // Expose theme service properties for template
  get isDark() {
    return this.themeService.isDark();
  }
  
  get currentTheme() {
    return this.themeService.theme();
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
