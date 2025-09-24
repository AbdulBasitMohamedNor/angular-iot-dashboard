import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Subject, takeUntil } from 'rxjs';

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  deviceId?: string;
  sensorType?: string;
}

export interface TimeSeriesConfig {
  title?: string;
  yAxisLabel?: string;
  unit?: string;
  showGrid?: boolean;
  showDataZoom?: boolean;
  smoothLine?: boolean;
  showPoints?: boolean;
  backgroundColor?: string;
  primaryColor?: string;
  height?: string;
}

@Component({
  selector: 'app-time-series-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `
    <div class="chart-container" [style.height]="config.height || '400px'">
      <div echarts 
           [options]="chartOptions" 
           [theme]="theme"
           class="chart"
           (chartInit)="onChartInit($event)"
           (chartClick)="onChartClick($event)">
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      padding: 16px;
      background: var(--surface-color, #ffffff);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .chart {
      width: 100%;
      height: 100%;
    }
    
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TimeSeriesChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: TimeSeriesDataPoint[] = [];
  @Input() config: TimeSeriesConfig = {};
  @Input() theme: string = 'light';
  @Input() loading = false;
  @Input() realtime = false;

  @ViewChild('chart', { static: true }) chartRef!: ElementRef;

  chartOptions: EChartsOption = {};
  private chart: any;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.chart) {
      this.chart.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['config']) {
      this.updateChart();
    }
  }

  onChartInit(chart: any): void {
    this.chart = chart;
    
    if (this.realtime) {
      this.startRealtimeUpdates();
    }
  }

  onChartClick(event: any): void {
    // Emit chart click events for interaction
    console.log('Chart clicked:', event);
  }

  private updateChart(): void {
    if (!this.data) return;

    const sortedData = [...this.data].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    const timeValues = sortedData.map(point => point.timestamp);
    const dataValues = sortedData.map(point => point.value);

    this.chartOptions = {
      title: {
        text: this.config.title || '',
        left: 'center',
        textStyle: {
          color: '#333',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params)) {
            const param = params[0];
            const date = new Date(param.axisValue).toLocaleString();
            const value = param.value;
            const unit = this.config.unit || '';
            
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${date}</div>
                <div style="color: ${param.color};">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                  ${this.config.yAxisLabel || 'Value'}: ${value}${unit}
                </div>
              </div>
            `;
          }
          return '';
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      legend: {
        data: [this.config.yAxisLabel || 'Value'],
        bottom: 0,
        textStyle: {
          color: '#666'
        }
      },
      grid: {
        left: '60px',
        right: '40px',
        bottom: '60px',
        top: '60px',
        containLabel: true,
        show: this.config.showGrid !== false,
        borderColor: '#e0e0e0'
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          formatter: (value: number) => {
            const date = new Date(value);
            return date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
        },
        splitLine: {
          show: this.config.showGrid !== false,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: this.config.yAxisLabel || '',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          formatter: (value: number) => {
            const unit = this.config.unit || '';
            return `${value}${unit}`;
          }
        },
        splitLine: {
          show: this.config.showGrid !== false,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      dataZoom: this.config.showDataZoom ? [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23.1h6.6V24.4z M13.3,19.6H6.7v-1.2h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: this.config.primaryColor || '#1976d2'
          }
        }
      ] : undefined,
      series: [
        {
          name: this.config.yAxisLabel || 'Value',
          type: 'line',
          smooth: this.config.smoothLine !== false,
          symbol: this.config.showPoints ? 'circle' : 'none',
          symbolSize: 4,
          lineStyle: {
            width: 2,
            color: this.config.primaryColor || '#1976d2'
          },
          itemStyle: {
            color: this.config.primaryColor || '#1976d2'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: this.config.primaryColor ? `${this.config.primaryColor}40` : '#1976d240'
                },
                {
                  offset: 1,
                  color: this.config.primaryColor ? `${this.config.primaryColor}10` : '#1976d210'
                }
              ]
            }
          },
          data: timeValues.map((time, index) => [time, dataValues[index]])
        }
      ],
      backgroundColor: this.config.backgroundColor || 'transparent',
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut'
    };

    // Apply loading state
    if (this.loading && this.chart) {
      this.chart.showLoading({
        text: 'Loading...',
        color: this.config.primaryColor || '#1976d2',
        textColor: '#666',
        maskColor: 'rgba(255, 255, 255, 0.8)'
      });
    } else if (this.chart) {
      this.chart.hideLoading();
    }
  }

  private startRealtimeUpdates(): void {
    if (!this.realtime) return;

    // For realtime updates, we'll listen for data changes
    // and automatically update the chart with smooth transitions
    const updateInterval = setInterval(() => {
      if (this.chart && this.data.length > 0) {
        // Get the latest data point
        const latestPoint = this.data[this.data.length - 1];
        
        // Add the new point with animation
        this.chart.setOption({
          series: [{
            data: this.data.map(point => [point.timestamp, point.value])
          }]
        }, false, true); // notMerge: false, lazyUpdate: true for smooth updates
      }
    }, 1000); // Update every second

    // Clean up interval on destroy
    this.destroy$.subscribe(() => {
      clearInterval(updateInterval);
    });
  }

  // Public methods for external control
  public zoomToTimeRange(startTime: Date, endTime: Date): void {
    if (!this.chart) return;

    const startPercent = this.getTimePercent(startTime);
    const endPercent = this.getTimePercent(endTime);

    this.chart.dispatchAction({
      type: 'dataZoom',
      start: startPercent,
      end: endPercent
    });
  }

  public resetZoom(): void {
    if (!this.chart) return;

    this.chart.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100
    });
  }

  public exportChart(type: 'png' | 'svg' = 'png'): string {
    if (!this.chart) return '';

    return this.chart.getDataURL({
      type: type,
      backgroundColor: '#ffffff'
    });
  }

  private getTimePercent(targetTime: Date): number {
    if (this.data.length === 0) return 0;

    const sortedData = [...this.data].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    const firstTime = sortedData[0].timestamp.getTime();
    const lastTime = sortedData[sortedData.length - 1].timestamp.getTime();
    const targetTimeMs = targetTime.getTime();

    if (targetTimeMs <= firstTime) return 0;
    if (targetTimeMs >= lastTime) return 100;

    return ((targetTimeMs - firstTime) / (lastTime - firstTime)) * 100;
  }
}