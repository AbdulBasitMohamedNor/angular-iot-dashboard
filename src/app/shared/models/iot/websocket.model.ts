import { SensorReading, DeviceStatus, DeviceCommand } from './device.model';

export interface WebSocketMessage {
  type: MessageType;
  deviceId?: string;
  timestamp: Date;
  data: any;
}

export interface DeviceDataMessage extends WebSocketMessage {
  type: MessageType.DEVICE_DATA;
  deviceId: string;
  data: {
    readings: SensorReading[];
  };
}

export interface DeviceStatusMessage extends WebSocketMessage {
  type: MessageType.DEVICE_STATUS;
  deviceId: string;
  data: {
    status: DeviceStatus;
    lastSeen: Date;
  };
}

export interface AlertMessage extends WebSocketMessage {
  type: MessageType.ALERT;
  data: {
    alert: Alert;
  };
}

export interface CommandMessage extends WebSocketMessage {
  type: MessageType.COMMAND;
  deviceId: string;
  data: {
    command: DeviceCommand;
  };
}

export enum MessageType {
  DEVICE_DATA = 'device_data',
  DEVICE_STATUS = 'device_status',
  ALERT = 'alert',
  COMMAND = 'command',
  HEARTBEAT = 'heartbeat',
  CONNECTION_STATUS = 'connection_status'
}

export interface Alert {
  id: string;
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export enum AlertType {
  DEVICE_OFFLINE = 'device_offline',
  LOW_BATTERY = 'low_battery',
  SENSOR_OUT_OF_RANGE = 'sensor_out_of_range',
  AUTOMATION_FAILED = 'automation_failed',
  CONNECTION_ERROR = 'connection_error',
  SECURITY_BREACH = 'security_breach'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Re-export types from device.model.ts for convenience
export type { 
  IoTDevice, 
  SensorReading, 
  DeviceCommand, 
  DeviceStatus,
  DeviceType,
  SensorType 
} from './device.model';