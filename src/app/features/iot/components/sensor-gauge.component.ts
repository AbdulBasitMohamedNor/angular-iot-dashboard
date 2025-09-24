import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { SensorData } from '../models/sensor.model';

@Component({
  selector: 'app-sensor-gauge',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `
    <div class="gauge-container">
      <div echarts 
           [options]="gaugeOptions()" 
           [theme]="'dark'"
           class="sensor-gauge">
      </div>
    </div>
  `,
  styles: [`
    .gauge-container {
      height: 150px;
      position: relative;
      margin: 15px 0;
    }

    .sensor-gauge {
      width: 100%;
      height: 100%;
    }
  `]
})
export class SensorGaugeComponent {
  readonly sensorData = input.required<SensorData>();

  readonly gaugeOptions = computed((): EChartsOption => {
    const sensor = this.sensorData();
    const percentage = (sensor.currentValue / sensor.maxValue) * 100;
    
    return {
      animation: true,
      animationDuration: 1000,
      series: [{
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '90%',
        min: 0,
        max: 100,
        splitNumber: 5,
        progress: {
          show: true,
          width: 8,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: sensor.color.primary },
                { offset: 1, color: sensor.color.secondary }
              ]
            }
          }
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 8,
            color: [[1, 'rgba(255,255,255,0.1)']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        detail: {
          show: true,
          offsetCenter: [0, '20%'],
          valueAnimation: true,
          formatter: (value: number) => {
            const actualValue = (value / 100) * sensor.maxValue;
            return `{value|${this.formatValue(actualValue)}}{unit| ${sensor.unit}}`;
          },
          rich: {
            value: {
              fontSize: 18,
              fontWeight: 'bold',
              color: '#ffffff'
            },
            unit: {
              fontSize: 12,
              color: '#8892b0'
            }
          }
        },
        data: [{
          value: percentage,
          name: sensor.name
        }]
      }]
    };
  });

  private formatValue(value: number): string {
    if (value >= 1000) {
      return value.toLocaleString();
    }
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }
}