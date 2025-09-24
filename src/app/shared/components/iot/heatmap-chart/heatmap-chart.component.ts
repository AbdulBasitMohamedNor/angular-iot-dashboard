import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

export interface HeatmapDataPoint {
  x: number | string;
  y: number | string;
  value: number;
  label?: string;
}

export interface HeatmapConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  unit?: string;
  colorScheme?: 'blues' | 'greens' | 'reds' | 'rainbow' | 'custom';
  customColors?: string[];
  showLabels?: boolean;
  cellBorderWidth?: number;
  height?: string;
  width?: string;
  invertY?: boolean;
}

@Component({
  selector: 'app-heatmap-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `
    <div class="heatmap-container" [style.height]="config.height || '400px'" [style.width]="config.width || '100%'">
      <div echarts 
           [options]="chartOptions" 
           [theme]="theme"
           class="heatmap-chart"
           (chartInit)="onChartInit($event)"
           (chartClick)="onChartClick($event)">
      </div>
      
      <div class="heatmap-legend" *ngIf="showLegend">
        <div class="legend-title">{{ config.unit || 'Value' }}</div>
        <div class="color-scale">
          <div class="scale-bar" [style.background]="getGradientBackground()"></div>
          <div class="scale-labels">
            <span class="min-label">{{ minValue | number:'1.1-1' }}</span>
            <span class="max-label">{{ maxValue | number:'1.1-1' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-container {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: var(--surface-color, #ffffff);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
    }
    
    .heatmap-chart {
      flex: 1;
      width: 100%;
      min-height: 300px;
    }
    
    .heatmap-legend {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }
    
    .legend-title {
      font-size: 12px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 8px;
      text-align: center;
    }
    
    .color-scale {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .scale-bar {
      height: 20px;
      width: 200px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    
    .scale-labels {
      display: flex;
      justify-content: space-between;
      width: 200px;
      font-size: 11px;
      color: #6c757d;
    }
    
    :host {
      display: block;
      width: 100%;
    }
    
    @media (max-width: 768px) {
      .heatmap-container {
        padding: 12px;
      }
      
      .scale-bar {
        width: 150px;
      }
      
      .scale-labels {
        width: 150px;
      }
    }
  `]
})
export class HeatmapChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: HeatmapDataPoint[] = [];
  @Input() config: HeatmapConfig = {};
  @Input() theme: string = 'light';
  @Input() showLegend: boolean = true;

  chartOptions: EChartsOption = {};
  minValue: number = 0;
  maxValue: number = 100;
  
  private chart: any;

  ngOnInit(): void {
    this.processData();
    this.updateChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['config']) {
      this.processData();
      this.updateChart();
    }
  }

  onChartInit(chart: any): void {
    this.chart = chart;
  }

  onChartClick(event: any): void {
    // Emit chart click events for interaction
    console.log('Heatmap cell clicked:', {
      x: event.data[0],
      y: event.data[1],
      value: event.data[2],
      dataIndex: event.dataIndex
    });
  }

  private processData(): void {
    if (this.data.length === 0) return;

    // Calculate min and max values for color scaling
    const values = this.data.map(point => point.value);
    this.minValue = Math.min(...values);
    this.maxValue = Math.max(...values);

    // Ensure min and max are different
    if (this.minValue === this.maxValue) {
      this.maxValue = this.minValue + 1;
    }
  }

  private updateChart(): void {
    if (!this.data.length) return;

    // Get unique x and y values for axes
    const xValues = [...new Set(this.data.map(point => point.x))].sort();
    const yValues = [...new Set(this.data.map(point => point.y))].sort();
    
    if (this.config.invertY) {
      yValues.reverse();
    }

    // Transform data for ECharts format: [x_index, y_index, value]
    const chartData = this.data.map(point => {
      const xIndex = xValues.indexOf(point.x);
      const yIndex = yValues.indexOf(point.y);
      return [xIndex, yIndex, point.value];
    });

    const colorScheme = this.getColorScheme();

    this.chartOptions = {
      title: {
        text: this.config.title || '',
        left: 'center',
        top: 20,
        textStyle: {
          color: '#333',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const xValue = xValues[params.data[0]];
          const yValue = yValues[params.data[1]];
          const value = params.data[2];
          const unit = this.config.unit || '';
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">
                ${this.config.xAxisLabel || 'X'}: ${xValue}<br>
                ${this.config.yAxisLabel || 'Y'}: ${yValue}
              </div>
              <div style="color: ${params.color};">
                ${this.config.title || 'Value'}: ${value}${unit}
              </div>
            </div>
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },

      grid: {
        height: '60%',
        top: '10%',
        left: '10%',
        right: '10%',
        containLabel: true
      },

      xAxis: {
        type: 'category',
        data: xValues,
        splitArea: {
          show: true
        },
        axisLabel: {
          color: '#666',
          fontSize: 11,
          interval: 0,
          rotate: xValues.length > 10 ? 45 : 0
        },
        name: this.config.xAxisLabel || '',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        }
      },

      yAxis: {
        type: 'category',
        data: yValues,
        splitArea: {
          show: true
        },
        axisLabel: {
          color: '#666',
          fontSize: 11
        },
        name: this.config.yAxisLabel || '',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        }
      },

      visualMap: {
        min: this.minValue,
        max: this.maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: colorScheme
        },
        text: ['High', 'Low'],
        textStyle: {
          color: '#666'
        }
      },

      series: [{
        name: this.config.title || 'Heatmap',
        type: 'heatmap',
        data: chartData,
        label: {
          show: this.config.showLabels !== false,
          fontSize: 10,
          color: '#000',
          formatter: (params: any) => {
            return params.data[2];
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: this.config.cellBorderWidth || 1
        }
      }],

      animation: true,
      animationDuration: 1000
    };
  }

  private getColorScheme(): string[] {
    if (this.config.customColors) {
      return this.config.customColors;
    }

    switch (this.config.colorScheme) {
      case 'blues':
        return ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'];
      
      case 'greens':
        return ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32'];
      
      case 'reds':
        return ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d'];
      
      case 'rainbow':
        return ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
      
      default: // blues
        return ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'];
    }
  }

  public getGradientBackground(): string {
    const colors = this.getColorScheme();
    const gradientStops = colors.map((color, index) => 
      `${color} ${(index / (colors.length - 1)) * 100}%`
    ).join(', ');
    
    return `linear-gradient(to right, ${gradientStops})`;
  }

  // Public methods for external control
  public setColorScheme(scheme: HeatmapConfig['colorScheme'], customColors?: string[]): void {
    this.config.colorScheme = scheme;
    if (customColors) {
      this.config.customColors = customColors;
    }
    this.updateChart();
  }

  public updateData(newData: HeatmapDataPoint[]): void {
    this.data = newData;
    this.processData();
    this.updateChart();
  }

  public exportChart(): string {
    if (!this.chart) return '';

    return this.chart.getDataURL({
      type: 'png',
      backgroundColor: '#ffffff'
    });
  }

  public highlightCell(x: number | string, y: number | string): void {
    if (!this.chart) return;

    // Find the data point
    const dataPoint = this.data.find(point => point.x === x && point.y === y);
    if (dataPoint) {
      const xValues = [...new Set(this.data.map(point => point.x))].sort();
      const yValues = [...new Set(this.data.map(point => point.y))].sort();
      
      const xIndex = xValues.indexOf(x);
      const yIndex = yValues.indexOf(y);

      this.chart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: this.data.indexOf(dataPoint)
      });
    }
  }

  public clearHighlight(): void {
    if (!this.chart) return;

    this.chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    });
  }

  // Utility methods
  public getDataAtPosition(x: number | string, y: number | string): HeatmapDataPoint | undefined {
    return this.data.find(point => point.x === x && point.y === y);
  }

  public getValueRange(): { min: number; max: number } {
    return { min: this.minValue, max: this.maxValue };
  }

  public getDimensions(): { xValues: (string | number)[]; yValues: (string | number)[] } {
    const xValues = [...new Set(this.data.map(point => point.x))].sort();
    const yValues = [...new Set(this.data.map(point => point.y))].sort();
    
    return { xValues, yValues };
  }
}