import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { SensorData, SensorType } from '../models/sensor.model';

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `
    <div class="card" [class]="getSensorClass()">
      <div class="card-header">
        <div class="card-title">{{ sensorData().name }}</div>
        <div class="card-icon" [style.background]="sensorData().color.primary">
          {{ sensorData().icon }}
        </div>
      </div>
      
      <div class="card-value">
        {{ formatValue(sensorData().currentValue) }}
        <span class="card-unit">{{ sensorData().unit }}</span>
      </div>

      @if (shouldShowGauge()) {
        <div class="chart-container">
          <div echarts 
               [options]="gaugeOptions()" 
               [theme]="'dark'"
               style="width: 100%; height: 120px;">
          </div>
        </div>
      } @else if (shouldShowChart()) {
        <div class="chart-container">
          <div echarts 
               [options]="chartOptions()" 
               [theme]="'dark'"
               style="width: 100%; height: 80px;">
          </div>
        </div>
      }

      @if (shouldShowProgressBar()) {
        <div class="progress-bar">
          <div class="progress-fill" 
               [style.width.%]="sensorData().progress"
               [style.background]="sensorData().color.primary">
          </div>
        </div>
      }

      @if (sensorData().controls?.length) {
        <div class="controls">
          @for (control of sensorData().controls!; track control.id) {
            <button class="btn" 
                    [class.active]="control.isActive"
                    (click)="onControlClick(control.id)">
              {{ control.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 25px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      height: 350px;
      min-width: 280px;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      border-color: var(--accent-color);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .card:hover::before {
      opacity: 1;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 0.9rem;
      font-weight: 500;
      color: #b0bec5;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
    }

    .card-value {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 15px;
      color: var(--accent-color);
    }

    .card-unit {
      font-size: 1rem;
      font-weight: 400;
      color: #78909c;
    }

    .chart-container {
      width: 100%;
      height: 120px;
      margin-top: auto;
      margin-bottom: 10px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .controls {
      display: flex;
      gap: 10px;
      margin-top: auto;
      padding-top: 10px;
      flex-shrink: 0;
    }

    .btn {
      flex: 1;
      padding: 8px 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--accent-color);
    }

    .btn.active {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: #000;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 10px;
      margin-bottom: 10px;
      flex-shrink: 0;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    /* Color schemes for different sensors */
    .temperature { --accent-color: #ff5722; }
    .humidity { --accent-color: #03a9f4; }
    .pressure { --accent-color: #9c27b0; }
    .motor_speed { --accent-color: #00e676; }
    .energy { --accent-color: #ffc107; }
    .production { --accent-color: #e91e63; }

    .status-running {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    @media (max-width: 768px) {
      .card {
        padding: 20px;
        min-width: auto;
        height: 320px;
        max-width: 100%;
      }

      .card-value {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .chart-container {
        height: 100px;
      }

      .controls {
        gap: 8px;
      }

      .btn {
        padding: 6px 12px;
        font-size: 0.75rem;
      }
    }
  `]
})
export class SensorCardComponent {
  readonly sensorData = input.required<SensorData>();
  readonly controlClick = output<{ sensorId: string; controlId: string }>();

  readonly chartOptions = computed((): EChartsOption => {
    const sensor = this.sensorData();
    const data = sensor.chartData || [];
    
    // Use different chart types based on sensor type
    if (sensor.type === SensorType.ENERGY) {
      // Donut chart for energy usage
      const usedEnergy = sensor.currentValue;
      const totalCapacity = this.getMaxValueForSensor(sensor.type);
      const remainingEnergy = totalCapacity - usedEnergy;
      
      return {
        animation: true,
        animationDuration: 1000,
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: { label: { show: false } },
          labelLine: { show: false },
          data: [
            {
              value: usedEnergy,
              name: 'Used',
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: sensor.color.primary },
                    { offset: 1, color: sensor.color.secondary || sensor.color.primary }
                  ]
                }
              }
            },
            {
              value: remainingEnergy,
              name: 'Available',
              itemStyle: {
                color: 'rgba(255,255,255,0.1)'
              }
            }
          ]
        }]
      };
    } else if (sensor.type === SensorType.PRODUCTION) {
      // Bar chart for production data
      return {
        animation: true,
        animationDuration: 750,
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        xAxis: {
          type: 'category',
          show: false,
          data: data.map((_, i) => i)
        },
        yAxis: {
          type: 'value',
          show: false,
          min: 'dataMin',
          max: 'dataMax'
        },
        series: [{
          type: 'bar',
          data: data,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: sensor.color.primary },
                { offset: 1, color: sensor.color.secondary || sensor.color.primary }
              ]
            },
            borderRadius: [2, 2, 0, 0]
          },
          animationDelay: (idx: number) => idx * 10
        }]
      };
    } else if (sensor.type === SensorType.MOTOR_SPEED) {
      // Area chart for motor speed
      return {
        animation: true,
        animationDuration: 750,
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        xAxis: {
          type: 'category',
          show: false,
          data: data.map((_, i) => i)
        },
        yAxis: {
          type: 'value',
          show: false,
          min: 'dataMin',
          max: 'dataMax'
        },
        series: [{
          type: 'line',
          data: data,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: sensor.color.primary,
            width: 3,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: sensor.color.primary + '60' },
                { offset: 1, color: sensor.color.primary + '10' }
              ]
            }
          },
          animationDelay: (idx: number) => idx * 5
        }]
      };
    } else {
      // Default line chart for humidity and other sensors
      return {
        animation: true,
        animationDuration: 750,
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        xAxis: {
          type: 'category',
          show: false,
          data: data.map((_, i) => i)
        },
        yAxis: {
          type: 'value',
          show: false,
          min: 'dataMin',
          max: 'dataMax'
        },
        series: [{
          type: 'line',
          data: data,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: sensor.color.primary,
            width: 2,
          },
          itemStyle: {
            color: sensor.color.primary,
            borderColor: '#ffffff',
            borderWidth: 1
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: sensor.color.primary + '40' },
                { offset: 1, color: sensor.color.primary + '00' }
              ]
            }
          },
          animationDelay: (idx: number) => idx * 5
        }]
      };
    }
  });

  readonly gaugeOptions = computed((): EChartsOption => {
    const sensor = this.sensorData();
    const value = sensor.currentValue;
    const maxValue = this.getMaxValueForSensor(sensor.type);
    
    return {
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -40,
        min: 0,
        max: maxValue,
        splitNumber: 5,
        itemStyle: {
          color: sensor.color.primary,
          shadowColor: sensor.color.primary + '40',
          shadowBlur: 10,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        progress: {
          show: true,
          roundCap: true,
          width: 8
        },
        pointer: {
          length: '60%',
          width: 4,
          itemStyle: {
            color: sensor.color.primary
          }
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 8,
            color: [[1, 'rgba(255,255,255,0.1)']]
          }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          fontSize: 14,
          color: '#ffffff',
          offsetCenter: [0, '80%']
        },
        detail: {
          width: 50,
          height: 14,
          fontSize: 18,
          color: sensor.color.primary,
          backgroundColor: 'transparent',
          borderRadius: 3,
          formatter: (value: number) => {
            if (sensor.type === SensorType.TEMPERATURE) {
              return Math.round(value) + '°C';
            } else if (sensor.type === SensorType.ENERGY) {
              return Math.round(value) + 'kW';
            } else if (sensor.type === SensorType.PRESSURE) {
              return Math.round(value) + 'bar';
            }
            return Math.round(value).toString();
          },
          offsetCenter: [0, '40%']
        },
        data: [{
          value: value,
          name: sensor.name
        }]
      }],
      backgroundColor: 'transparent'
    };
  });

  getSensorClass(): string {
    return this.sensorData().type;
  }

  shouldShowGauge(): boolean {
    const type = this.sensorData().type;
    return type === SensorType.TEMPERATURE || type === SensorType.PRESSURE;
  }

  shouldShowChart(): boolean {
    const type = this.sensorData().type;
    return type === SensorType.HUMIDITY || type === SensorType.MOTOR_SPEED || type === SensorType.PRODUCTION || type === SensorType.ENERGY;
  }

  shouldShowProgressBar(): boolean {
    const type = this.sensorData().type;
    return type === SensorType.ENERGY || type === SensorType.PRODUCTION;
  }

  getMaxValueForSensor(type: SensorType): number {
    switch (type) {
      case SensorType.TEMPERATURE:
        return 100; // 0-100°C
      case SensorType.PRESSURE:
        return 50; // 0-50 bar
      case SensorType.ENERGY:
        return 500; // 0-500 kW
      case SensorType.HUMIDITY:
        return 100; // 0-100%
      case SensorType.MOTOR_SPEED:
        return 3000; // 0-3000 RPM
      case SensorType.PRODUCTION:
        return 1000; // 0-1000 units/hour
      default:
        return 100;
    }
  }

  formatValue(value: number): string {
    if (value >= 1000) {
      return value.toLocaleString();
    }
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }

  formatGaugeValue(): string {
    const sensor = this.sensorData();
    const value = sensor.currentValue;
    
    if (sensor.type === SensorType.TEMPERATURE) {
      return Math.round(value) + '°';
    } else if (sensor.type === SensorType.ENERGY) {
      return Math.round(value) + 'kW';
    } else if (sensor.type === SensorType.PRESSURE) {
      return Math.round(value).toString();
    }
    
    return this.formatValue(value);
  }

  onControlClick(controlId: string): void {
    this.controlClick.emit({
      sensorId: this.sensorData().id,
      controlId
    });
  }
}