// Chart Components
export * from './time-series-chart/time-series-chart.component';
export * from './gauge-chart/gauge-chart.component';
export * from './heatmap-chart/heatmap-chart.component';

// Chart component types and interfaces
export type { TimeSeriesDataPoint, TimeSeriesConfig } from './time-series-chart/time-series-chart.component';
export type { GaugeConfig } from './gauge-chart/gauge-chart.component';
export type { HeatmapDataPoint, HeatmapConfig } from './heatmap-chart/heatmap-chart.component';

// Chart utilities
export const CHART_THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const;

export const CHART_COLOR_SCHEMES = {
  BLUES: 'blues',
  GREENS: 'greens',
  REDS: 'reds',
  RAINBOW: 'rainbow',
  CUSTOM: 'custom'
} as const;