import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

export interface GaugeConfig {
  title?: string;
  min?: number;
  max?: number;
  unit?: string;
  style?: 'gradient' | 'minimalist' | 'professional' | 'modern';
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  colors?: {
    low: string;
    medium: string;
    high: string;
    danger: string;
  };
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  animated?: boolean;
}

@Component({
  selector: 'app-gauge-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `
    <div class="gauge-container" [ngClass]="'size-' + (config.size || 'medium') + ' style-' + (config.style || 'modern')">
      <div echarts 
           [options]="chartOptions" 
           [theme]="theme"
           class="gauge-chart"
           (chartInit)="onChartInit($event)">
      </div>
      
      <div class="gauge-info" *ngIf="showInfo">
        <div class="current-value" *ngIf="config.style !== 'minimalist'">
          <span class="value">{{ value | number:'1.0-1' }}</span>
          <span class="unit">{{ config.unit || '' }}</span>
        </div>
        <div class="gauge-title" *ngIf="config.title">{{ config.title }}</div>
        <div class="status-indicator" [ngClass]="statusClass">
          <div class="status-dot"></div>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gauge-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 20px;
      box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }
    
    .gauge-container:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 30px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.15);
    }
    
    .gauge-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.8), 
        transparent
      );
      z-index: 1;
    }
    
    .gauge-chart {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
    }
    
    /* Size Variations */
    .size-small {
      width: 240px;
      height: 240px;
      padding: 16px;
    }
    
    .size-small .gauge-chart {
      height: 160px;
    }
    
    .size-medium {
      width: 300px;
      height: 300px;
      padding: 20px;
    }
    
    .size-medium .gauge-chart {
      height: 220px;
    }
    
    .size-large {
      width: 380px;
      height: 380px;
      padding: 24px;
    }
    
    .size-large .gauge-chart {
      height: 280px;
    }
    
    /* Style Variations */
    .style-gradient {
      background: linear-gradient(135deg, 
        rgba(99, 102, 241, 0.1) 0%, 
        rgba(219, 234, 254, 0.8) 50%, 
        rgba(147, 197, 253, 0.1) 100%
      );
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    
    .style-minimalist {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      box-shadow: 
        0 1px 3px rgba(0, 0, 0, 0.05),
        0 20px 40px rgba(0, 0, 0, 0.05);
    }
    
    .style-professional {
      background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
      color: #f8fafc;
      border: 1px solid #475569;
    }
    
    .style-modern {
      background: linear-gradient(145deg, 
        rgba(248, 250, 252, 0.9) 0%, 
        rgba(241, 245, 249, 0.8) 100%
      );
      backdrop-filter: blur(20px);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }
    
    .gauge-info {
      text-align: center;
      margin-top: 12px;
      z-index: 2;
    }
    
    .current-value {
      margin-bottom: 8px;
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
    }
    
    .value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
      letter-spacing: -0.5px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .size-small .value {
      font-size: 22px;
    }
    
    .size-large .value {
      font-size: 36px;
    }
    
    .unit {
      font-size: 16px;
      color: #64748b;
      font-weight: 500;
      margin-left: 2px;
    }
    
    .gauge-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
      letter-spacing: 0.025em;
      text-transform: uppercase;
    }
    
    .style-professional .gauge-title,
    .style-professional .value {
      color: #f1f5f9;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 4px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 0 0 0 currentColor;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 currentColor;
      }
      70% {
        box-shadow: 0 0 0 6px transparent;
      }
      100% {
        box-shadow: 0 0 0 0 transparent;
      }
    }
    
    .status-text {
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
      letter-spacing: 0.025em;
    }
    
    .status-optimal {
      color: #059669;
    }
    
    .status-optimal .status-dot {
      background-color: #10b981;
    }
    
    .status-warning {
      color: #d97706;
    }
    
    .status-warning .status-dot {
      background-color: #f59e0b;
    }
    
    .status-critical {
      color: #dc2626;
    }
    
    .status-critical .status-dot {
      background-color: #ef4444;
    }
    
    .status-normal {
      color: #2563eb;
    }
    
    .status-normal .status-dot {
      background-color: #3b82f6;
    }
    
    /* Dark theme for professional style */
    .style-professional .status-optimal {
      color: #34d399;
    }
    
    .style-professional .status-warning {
      color: #fbbf24;
    }
    
    .style-professional .status-critical {
      color: #f87171;
    }
    
    .style-professional .status-normal {
      color: #60a5fa;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .size-large {
        width: 300px;
        height: 300px;
      }
      
      .size-medium {
        width: 260px;
        height: 260px;
      }
      
      .size-small {
        width: 220px;
        height: 220px;
      }
    }
  `]
})
export class GaugeChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() value: number = 0;
  @Input() config: GaugeConfig = {};
  @Input() theme: string = 'light';
  @Input() showInfo: boolean = true;

  chartOptions!: EChartsOption;
  statusClass: string = 'status-normal';
  statusText: string = 'Normal';
  
  private chartInstance: any;

  ngOnInit(): void {
    this.updateChartOptions();
    this.updateStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['config']) {
      this.updateChartOptions();
      this.updateStatus();
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  }

  onChartInit(chart: any): void {
    this.chartInstance = chart;
  }

  private updateChartOptions(): void {
    const style = this.config.style || 'modern';
    
    switch (style) {
      case 'gradient':
        this.chartOptions = this.createGradientGauge();
        break;
      case 'minimalist':
        this.chartOptions = this.createMinimalistGauge();
        break;
      case 'professional':
        this.chartOptions = this.createProfessionalGauge();
        break;
      default:
        this.chartOptions = this.createModernGauge();
    }
  }

  private createModernGauge(): EChartsOption {
    const { min = 0, max = 100 } = this.config;
    const valueColor = this.getValueColor(this.value);
    
    return {
      series: [{
        type: 'gauge',
        center: ['50%', '55%'],
        radius: '85%',
        min,
        max,
        startAngle: 210,
        endAngle: -30,
        splitNumber: 4,
        itemStyle: {
          color: valueColor.primary,
        },
        progress: {
          show: true,
          width: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: valueColor.gradient,
            },
            shadowBlur: 10,
            shadowColor: valueColor.primary,
          }
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [1, 'rgba(226, 232, 240, 0.3)']
            ]
          }
        },
        axisTick: { show: false },
        splitLine: {
          show: true,
          distance: -25,
          length: 8,
          lineStyle: {
            width: 2,
            color: '#cbd5e1'
          }
        },
        axisLabel: {
          show: true,
          distance: -40,
          color: '#64748b',
          fontSize: 11,
          fontWeight: 500,
          formatter: (value: number) => {
            if (value === min) return `${value}`;
            if (value === max) return `${value}`;
            return '';
          }
        },
        anchor: { show: false },
        title: { show: false },
        detail: {
          show: this.config.style === 'minimalist',
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '20%'],
          fontSize: 24,
          fontWeight: 'bold',
          formatter: `{value}${this.config.unit || ''}`,
          color: valueColor.primary
        },
        data: [{ value: this.value, name: this.config.title || '' }]
      }],
      animation: this.config.animated !== false,
      animationDuration: 800,
      animationEasing: 'cubicOut'
    };
  }

  private createGradientGauge(): EChartsOption {
    const { min = 0, max = 100 } = this.config;
    
    return {
      series: [{
        type: 'gauge',
        center: ['50%', '55%'],
        radius: '80%',
        min,
        max,
        startAngle: 225,
        endAngle: -45,
        splitNumber: 5,
        progress: {
          show: true,
          width: 25,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#8b5cf6' },
                { offset: 0.3, color: '#a855f7' },
                { offset: 0.6, color: '#c084fc' },
                { offset: 1, color: '#e879f9' }
              ]
            },
            shadowBlur: 15,
            shadowColor: 'rgba(139, 92, 246, 0.3)',
          }
        },
        axisLine: {
          lineStyle: {
            width: 25,
            color: [[1, 'rgba(139, 92, 246, 0.1)']]
          }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: { show: false },
        data: [{ value: this.value }]
      }]
    };
  }

  private createMinimalistGauge(): EChartsOption {
    const { min = 0, max = 100 } = this.config;
    
    return {
      series: [{
        type: 'gauge',
        center: ['50%', '50%'],
        radius: '75%',
        min,
        max,
        startAngle: 220,
        endAngle: -40,
        progress: {
          show: true,
          width: 6,
          itemStyle: {
            color: '#1e293b',
          }
        },
        axisLine: {
          lineStyle: {
            width: 6,
            color: [[1, '#f1f5f9']]
          }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          show: true,
          valueAnimation: true,
          fontSize: 32,
          fontWeight: 300,
          color: '#1e293b',
          offsetCenter: [0, 0],
          formatter: '{value}'
        },
        data: [{ value: this.value }]
      }]
    };
  }

  private createProfessionalGauge(): EChartsOption {
    const { min = 0, max = 100 } = this.config;
    const valueColor = this.getValueColor(this.value);
    
    return {
      backgroundColor: 'transparent',
      series: [
        // Outer ring
        {
          type: 'gauge',
          center: ['50%', '55%'],
          radius: '85%',
          min,
          max,
          startAngle: 210,
          endAngle: -30,
          splitNumber: 8,
          axisLine: {
            lineStyle: {
              width: 2,
              color: [[1, '#475569']]
            }
          },
          axisTick: {
            show: true,
            distance: -15,
            length: 8,
            lineStyle: {
              color: '#64748b',
              width: 1
            }
          },
          splitLine: {
            show: true,
            distance: -20,
            length: 15,
            lineStyle: {
              color: '#64748b',
              width: 2
            }
          },
          axisLabel: {
            show: true,
            distance: -35,
            color: '#94a3b8',
            fontSize: 10,
            fontWeight: 500
          },
          pointer: { show: false },
          detail: { show: false },
          data: [{ value: this.value }]
        },
        // Inner progress
        {
          type: 'gauge',
          center: ['50%', '55%'],
          radius: '75%',
          min,
          max,
          startAngle: 210,
          endAngle: -30,
          progress: {
            show: true,
            width: 12,
            itemStyle: {
              color: valueColor.primary,
              shadowBlur: 8,
              shadowColor: valueColor.primary,
            }
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[1, 'rgba(71, 85, 105, 0.3)']]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: { show: false },
          data: [{ value: this.value }]
        }
      ]
    };
  }

  private getValueColor(value: number): { primary: string; gradient: any[] } {
    const { thresholds = { low: 30, medium: 60, high: 80 } } = this.config;
    
    if (value <= thresholds.low) {
      return {
        primary: '#3b82f6',
        gradient: [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#1d4ed8' }
        ]
      };
    } else if (value <= thresholds.medium) {
      return {
        primary: '#10b981',
        gradient: [
          { offset: 0, color: '#10b981' },
          { offset: 1, color: '#047857' }
        ]
      };
    } else if (value <= thresholds.high) {
      return {
        primary: '#f59e0b',
        gradient: [
          { offset: 0, color: '#f59e0b' },
          { offset: 1, color: '#d97706' }
        ]
      };
    } else {
      return {
        primary: '#ef4444',
        gradient: [
          { offset: 0, color: '#ef4444' },
          { offset: 1, color: '#dc2626' }
        ]
      };
    }
  }

  private updateStatus(): void {
    const { thresholds = { low: 30, medium: 60, high: 80 } } = this.config;
    
    if (this.value <= thresholds.low) {
      this.statusClass = 'status-normal';
      this.statusText = 'Normal';
    } else if (this.value <= thresholds.medium) {
      this.statusClass = 'status-optimal';
      this.statusText = 'Optimal';
    } else if (this.value <= thresholds.high) {
      this.statusClass = 'status-warning';
      this.statusText = 'Warning';
    } else {
      this.statusClass = 'status-critical';
      this.statusText = 'Critical';
    }
  }
}