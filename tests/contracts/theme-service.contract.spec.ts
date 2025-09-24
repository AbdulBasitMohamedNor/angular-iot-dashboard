import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../src/app/services/theme.service';
import { Theme } from '../../src/app/models/theme.model';

describe('ThemeService Contract Tests', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  describe('Theme Management', () => {
    it('should have a current theme signal', () => {
      expect(service.currentTheme).toBeDefined();
      expect(typeof service.currentTheme).toBe('function'); // Signal
    });

    it('should start with default light theme', () => {
      const theme = service.currentTheme();
      expect(theme.name).toBe('Light');
      expect(theme.primary).toBeDefined();
      expect(theme.background).toBeDefined();
      expect(theme.surface).toBeDefined();
    });

    it('should have all predefined themes available', () => {
      const availableThemes = service.getAvailableThemes();
      
      expect(availableThemes).toHaveLength(3);
      
      const themeNames = availableThemes.map(t => t.name);
      expect(themeNames).toContain('Light');
      expect(themeNames).toContain('Dark');
      expect(themeNames).toContain('Azure Blue');
    });

    it('should validate theme structure for all available themes', () => {
      const themes = service.getAvailableThemes();
      
      themes.forEach(theme => {
        expect(theme.id).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.primary).toBeDefined();
        expect(theme.accent).toBeDefined();
        expect(theme.warn).toBeDefined();
        expect(theme.background).toBeDefined();
        expect(theme.surface).toBeDefined();
        expect(theme.surfaceVariant).toBeDefined();
        expect(theme.onPrimary).toBeDefined();
        expect(theme.onSurface).toBeDefined();
        expect(typeof theme.isDark).toBe('boolean');
      });
    });
  });

  describe('Theme Switching', () => {
    it('should switch to dark theme successfully', async () => {
      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      expect(darkTheme).toBeDefined();

      await service.setTheme(darkTheme!.id);
      
      const currentTheme = service.currentTheme();
      expect(currentTheme.name).toBe('Dark');
      expect(currentTheme.isDark).toBe(true);
    });

    it('should switch to Azure Blue theme successfully', async () => {
      const azureTheme = service.getAvailableThemes().find(t => t.name === 'Azure Blue');
      expect(azureTheme).toBeDefined();

      await service.setTheme(azureTheme!.id);
      
      const currentTheme = service.currentTheme();
      expect(currentTheme.name).toBe('Azure Blue');
    });

    it('should persist theme selection', async () => {
      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      await service.setTheme(darkTheme!.id);

      // Simulate service restart
      const newService = TestBed.inject(ThemeService);
      const persistedTheme = newService.currentTheme();
      
      expect(persistedTheme.name).toBe('Dark');
    });

    it('should emit theme change events', async () => {
      let themeChangeCount = 0;
      let lastTheme: Theme | null = null;

      // Subscribe to theme changes
      service.themeChanged$.subscribe(theme => {
        themeChangeCount++;
        lastTheme = theme;
      });

      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      await service.setTheme(darkTheme!.id);

      expect(themeChangeCount).toBeGreaterThan(0);
      expect(lastTheme?.name).toBe('Dark');
    });

    it('should update signals reactively on theme change', async () => {
      const initialTheme = service.currentTheme();
      expect(initialTheme.name).toBe('Light');

      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      await service.setTheme(darkTheme!.id);

      // Signal should update immediately
      const updatedTheme = service.currentTheme();
      expect(updatedTheme.name).toBe('Dark');
      expect(updatedTheme.isDark).toBe(true);
    });
  });

  describe('CSS Custom Properties', () => {
    it('should apply CSS custom properties on theme change', async () => {
      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      await service.setTheme(darkTheme!.id);

      // Check if CSS custom properties are set on document root
      const rootElement = document.documentElement;
      const primaryColor = getComputedStyle(rootElement).getPropertyValue('--primary-color').trim();
      
      expect(primaryColor).toBe(darkTheme!.primary);
    });

    it('should update body class on theme change', async () => {
      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      await service.setTheme(darkTheme!.id);

      expect(document.body.classList.contains('dark-theme')).toBe(true);

      const lightTheme = service.getAvailableThemes().find(t => t.name === 'Light');
      await service.setTheme(lightTheme!.id);

      expect(document.body.classList.contains('dark-theme')).toBe(false);
      expect(document.body.classList.contains('light-theme')).toBe(true);
    });

    it('should handle rapid theme switching without errors', async () => {
      const themes = service.getAvailableThemes();
      
      // Rapidly switch between all themes
      for (let i = 0; i < 5; i++) {
        for (const theme of themes) {
          await service.setTheme(theme.id);
          expect(service.currentTheme().id).toBe(theme.id);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid theme ID', async () => {
      await expect(service.setTheme('invalid-theme-id'))
        .rejects.toThrow('Theme not found');
    });

    it('should gracefully handle corrupted localStorage', async () => {
      // Corrupt the localStorage theme data
      localStorage.setItem('todo-app-theme', 'invalid-json');

      // Service should fallback to default theme
      const newService = TestBed.inject(ThemeService);
      const theme = newService.currentTheme();
      
      expect(theme.name).toBe('Light');
    });

    it('should handle missing localStorage gracefully', async () => {
      // Mock localStorage as undefined
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      try {
        const newService = TestBed.inject(ThemeService);
        const theme = newService.currentTheme();
        
        expect(theme.name).toBe('Light');
      } finally {
        (window as any).localStorage = originalLocalStorage;
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should initialize theme in less than 50ms', async () => {
      const start = performance.now();
      TestBed.inject(ThemeService);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should apply theme change in less than 100ms', async () => {
      const darkTheme = service.getAvailableThemes().find(t => t.name === 'Dark');
      
      const start = performance.now();
      await service.setTheme(darkTheme!.id);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 100 rapid theme switches without memory leaks', async () => {
      const themes = service.getAvailableThemes();
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many theme switches
      for (let i = 0; i < 100; i++) {
        const theme = themes[i % themes.length];
        await service.setTheme(theme.id);
      }

      // Allow GC to run
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should not increase significantly (allowing for 5MB tolerance)
      if (initialMemory > 0 && finalMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(5 * 1024 * 1024);
      }
    });
  });
});