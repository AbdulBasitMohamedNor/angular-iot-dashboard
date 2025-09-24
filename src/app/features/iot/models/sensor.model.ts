export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface SensorData {
  id: string;
  name: string;
  type: SensorType;
  icon: string;
  currentValue: number;
  unit: string;
  minValue: number;
  maxValue: number;
  progress: number;
  color: {
    primary: string;
    secondary: string;
  };
  isOnline: boolean;
  lastUpdated: Date;
  controls?: SensorControl[];
  chartData?: number[];
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  MOTOR_SPEED = 'motor_speed',
  ENERGY = 'energy',
  PRODUCTION = 'production'
}

export interface SensorControl {
  id: string;
  label: string;
  isActive: boolean;
  action: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  sensorId?: string;
}

export enum AlertType {
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info'
}