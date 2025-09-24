import { Injectable, signal } from '@angular/core';
import { interval } from 'rxjs';
import { SensorData, SensorType, Alert, AlertType } from '../models/sensor.model';

@Injectable({
  providedIn: 'root'
})
export class IotDataService {
  private readonly sensors = signal<SensorData[]>([
    {
      id: 'temp-001',
      name: 'Temperature Sensor',
      type: SensorType.TEMPERATURE,
      icon: '🌡️',
      currentValue: 72.5,
      unit: '°F',
      minValue: 32,
      maxValue: 120,
      progress: 65,
      color: {
        primary: '#ff6348',
        secondary: '#ff4757'
      },
      isOnline: true,
      lastUpdated: new Date(),
      controls: [
        { id: 'auto', label: 'Auto', isActive: true, action: 'auto' },
        { id: 'manual', label: 'Manual', isActive: false, action: 'manual' }
      ],
      chartData: this.generateChartData()
    },
    {
      id: 'hum-001',
      name: 'Humidity Monitor',
      type: SensorType.HUMIDITY,
      icon: '💧',
      currentValue: 45,
      unit: '%',
      minValue: 0,
      maxValue: 100,
      progress: 45,
      color: {
        primary: '#00d4ff',
        secondary: '#0984e3'
      },
      isOnline: true,
      lastUpdated: new Date(),
      controls: [
        { id: 'increase', label: 'Increase', isActive: false, action: 'increase' },
        { id: 'decrease', label: 'Decrease', isActive: false, action: 'decrease' }
      ],
      chartData: this.generateChartData()
    },
    {
      id: 'press-001',
      name: 'Pressure Gauge',
      type: SensorType.PRESSURE,
      icon: '🎯',
      currentValue: 1013,
      unit: 'hPa',
      minValue: 900,
      maxValue: 1100,
      progress: 75,
      color: {
        primary: '#a55eea',
        secondary: '#8854d0'
      },
      isOnline: true,
      lastUpdated: new Date(),
      controls: [
        { id: 'monitor', label: 'Monitor', isActive: true, action: 'monitor' },
        { id: 'calibrate', label: 'Calibrate', isActive: false, action: 'calibrate' }
      ],
      chartData: this.generateChartData()
    },
    {
      id: 'motor-001',
      name: 'Motor Speed',
      type: SensorType.MOTOR_SPEED,
      icon: '⚙️',
      currentValue: 1750,
      unit: 'RPM',
      minValue: 0,
      maxValue: 3000,
      progress: 58,
      color: {
        primary: '#00ff88',
        secondary: '#00b894'
      },
      isOnline: true,
      lastUpdated: new Date(),
      controls: [
        { id: 'start', label: 'Start', isActive: false, action: 'start' },
        { id: 'running', label: 'Running', isActive: true, action: 'running' },
        { id: 'stop', label: 'Stop', isActive: false, action: 'stop' }
      ],
      chartData: this.generateChartData()
    },
    {
      id: 'energy-001',
      name: 'Energy Meter',
      type: SensorType.ENERGY,
      icon: '⚡',
      currentValue: 325.7,
      unit: 'kWh',
      minValue: 0,
      maxValue: 500,
      progress: 70,
      color: {
        primary: '#ffd700',
        secondary: '#f39c12'
      },
      isOnline: true,
      lastUpdated: new Date(),
      controls: [
        { id: 'daily', label: 'Daily', isActive: false, action: 'daily' },
        { id: 'weekly', label: 'Weekly', isActive: true, action: 'weekly' },
        { id: 'monthly', label: 'Monthly', isActive: false, action: 'monthly' }
      ],
      chartData: this.generateChartData()
    },
    {
      id: 'prod-001',
      name: 'Production Line',
      type: SensorType.PRODUCTION,
      icon: '📦',
      currentValue: 8542,
      unit: 'units',
      minValue: 0,
      maxValue: 10000,
      progress: 85,
      color: {
        primary: '#ff6b9d',
        secondary: '#c44569'
      },
      isOnline: true,
      lastUpdated: new Date(),
      controls: [
        { id: 'reset', label: 'Reset', isActive: false, action: 'reset' },
        { id: 'track', label: 'Track', isActive: true, action: 'track' },
        { id: 'export', label: 'Export', isActive: false, action: 'export' }
      ],
      chartData: this.generateChartData()
    }
  ]);

  private readonly alerts = signal<Alert[]>([
    {
      id: 'alert-001',
      type: AlertType.WARNING,
      title: 'Temperature approaching upper limit in Zone A',
      description: 'Monitor closely',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: '⚠️',
      sensorId: 'temp-001'
    },
    {
      id: 'alert-002',
      type: AlertType.INFO,
      title: 'Scheduled maintenance for Motor Unit 3 tomorrow',
      description: 'Plan accordingly',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      icon: 'ℹ️',
      sensorId: 'motor-001'
    },
    {
      id: 'alert-003',
      type: AlertType.ERROR,
      title: 'Pressure sensor calibration required',
      description: 'Immediate attention needed',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      icon: '❌',
      sensorId: 'press-001'
    }
  ]);

  readonly sensorsData = this.sensors.asReadonly();
  readonly alertsData = this.alerts.asReadonly();

  constructor() {
    // Simulate real-time updates
    interval(3000).subscribe(() => {
      this.updateSensorValues();
    });
  }

  private generateChartData(): number[] {
    return Array.from({ length: 20 }, () => Math.random() * 60 + 20);
  }

  private updateSensorValues(): void {
    this.sensors.update(sensors => 
      sensors.map(sensor => ({
        ...sensor,
        currentValue: this.generateRandomValue(sensor),
        progress: this.calculateProgress(sensor),
        lastUpdated: new Date(),
        chartData: [...(sensor.chartData?.slice(1) || []), Math.random() * 60 + 20]
      }))
    );
  }

  private generateRandomValue(sensor: SensorData): number {
    const current = sensor.currentValue;
    const variance = (sensor.maxValue - sensor.minValue) * 0.02; // 2% variance
    const change = (Math.random() - 0.5) * variance;
    const newValue = current + change;
    
    // Keep within bounds
    return Math.max(sensor.minValue, Math.min(sensor.maxValue, newValue));
  }

  private calculateProgress(sensor: SensorData): number {
    const range = sensor.maxValue - sensor.minValue;
    const position = sensor.currentValue - sensor.minValue;
    return Math.round((position / range) * 100);
  }

  updateSensorControl(sensorId: string, controlId: string): void {
    this.sensors.update(sensors =>
      sensors.map(sensor => {
        if (sensor.id === sensorId && sensor.controls) {
          const updatedControls = sensor.controls.map(control => ({
            ...control,
            isActive: control.id === controlId
          }));
          return { ...sensor, controls: updatedControls };
        }
        return sensor;
      })
    );
  }

  getSensorById(id: string): SensorData | undefined {
    return this.sensors().find(sensor => sensor.id === id);
  }

  getSystemStatus(): 'operational' | 'warning' | 'error' {
    const errorAlerts = this.alerts().filter(alert => alert.type === AlertType.ERROR);
    const warningAlerts = this.alerts().filter(alert => alert.type === AlertType.WARNING);
    
    if (errorAlerts.length > 0) return 'error';
    if (warningAlerts.length > 0) return 'warning';
    return 'operational';
  }
}