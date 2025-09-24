export interface Theme {
  id: string;
  name: string;
  primary: string;
  accent: string;
  warn: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  onPrimary: string;
  onSurface: string;
  isDark: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    accent: string;
    warn: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    onPrimary: string;
    onSurface: string;
  };
  isDark: boolean;
}

export class ThemeFactory {
  static createTheme(config: ThemeConfig): Theme {
    return {
      id: config.id,
      name: config.name,
      primary: config.colors.primary,
      accent: config.colors.accent,
      warn: config.colors.warn,
      background: config.colors.background,
      surface: config.colors.surface,
      surfaceVariant: config.colors.surfaceVariant,
      onPrimary: config.colors.onPrimary,
      onSurface: config.colors.onSurface,
      isDark: config.isDark
    };
  }
  
  static getDefaultThemes(): Theme[] {
    return [
      ThemeFactory.createTheme({
        id: 'light',
        name: 'Light',
        colors: {
          primary: '#1976d2',
          accent: '#ff4081',
          warn: '#f44336',
          background: '#fafafa',
          surface: '#ffffff',
          surfaceVariant: '#f5f5f5',
          onPrimary: '#ffffff',
          onSurface: '#212121'
        },
        isDark: false
      }),
      ThemeFactory.createTheme({
        id: 'dark',
        name: 'Dark',
        colors: {
          primary: '#90caf9',
          accent: '#f48fb1',
          warn: '#f44336',
          background: '#121212',
          surface: '#1e1e1e',
          surfaceVariant: '#2e2e2e',
          onPrimary: '#000000',
          onSurface: '#ffffff'
        },
        isDark: true
      }),
      ThemeFactory.createTheme({
        id: 'azure',
        name: 'Azure Blue',
        colors: {
          primary: '#0078d4',
          accent: '#40e0d0',
          warn: '#d13438',
          background: '#f8f9fa',
          surface: '#ffffff',
          surfaceVariant: '#f1f3f4',
          onPrimary: '#ffffff',
          onSurface: '#323130'
        },
        isDark: false
      })
    ];
  }
}

export class ThemeUtils {
  static validateTheme(theme: Theme): void {
    if (!theme.id || theme.id.trim() === '') {
      throw new Error('Theme ID is required');
    }
    
    if (!theme.name || theme.name.trim() === '') {
      throw new Error('Theme name is required');
    }
    
    const requiredColors = [
      'primary', 'accent', 'warn', 'background', 
      'surface', 'surfaceVariant', 'onPrimary', 'onSurface'
    ];
    
    for (const colorKey of requiredColors) {
      const colorValue = theme[colorKey as keyof Theme];
      if (!colorValue || typeof colorValue !== 'string' || !colorValue.startsWith('#')) {
        throw new Error(`Invalid color for ${colorKey}: must be a valid hex color`);
      }
    }
    
    if (typeof theme.isDark !== 'boolean') {
      throw new Error('isDark must be a boolean');
    }
  }
  
  static isValidThemeId(id: string, availableThemes: Theme[]): boolean {
    return availableThemes.some(theme => theme.id === id);
  }
  
  static getThemeById(id: string, availableThemes: Theme[]): Theme | null {
    return availableThemes.find(theme => theme.id === id) || null;
  }
  
  static getCssClassName(theme: Theme): string {
    return `${theme.isDark ? 'dark' : 'light'}-theme`;
  }
  
  static generateCssCustomProperties(theme: Theme): Record<string, string> {
    return {
      '--primary-color': theme.primary,
      '--accent-color': theme.accent,
      '--warn-color': theme.warn,
      '--background-color': theme.background,
      '--surface-color': theme.surface,
      '--surface-variant-color': theme.surfaceVariant,
      '--on-primary-color': theme.onPrimary,
      '--on-surface-color': theme.onSurface
    };
  }
  
  static applyCssCustomProperties(theme: Theme, element: HTMLElement = document.documentElement): void {
    const properties = ThemeUtils.generateCssCustomProperties(theme);
    
    Object.entries(properties).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  }
  
  static applyBodyClass(theme: Theme): void {
    const body = document.body;
    
    // Remove all theme classes
    const themeClasses = ['light-theme', 'dark-theme', 'azure-theme'];
    themeClasses.forEach(cls => body.classList.remove(cls));
    
    // Add current theme class
    const themeClass = theme.id === 'azure' ? 'azure-theme' : ThemeUtils.getCssClassName(theme);
    body.classList.add(themeClass);
  }
  
  static contrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}