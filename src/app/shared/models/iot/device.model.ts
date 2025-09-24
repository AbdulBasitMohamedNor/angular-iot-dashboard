export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  room: string;
  status: DeviceStatus;
  lastSeen: Date;
  battery?: number;
  properties: DeviceProperties;
  capabilities: DeviceCapability[];
}

export interface SensorReading {
  deviceId: string;
  timestamp: Date;
  value: number;
  unit: string;
  type: SensorType;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Condition[];
  actions: Action[];
  lastTriggered?: Date;
}

export interface Condition {
  deviceId: string;
  property: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface Action {
  deviceId: string;
  action: string;
  parameters: Record<string, any>;
  delay?: number;
}

export enum DeviceType {
  SENSOR = 'sensor',
  SWITCH = 'switch',
  THERMOSTAT = 'thermostat',
  CAMERA = 'camera',
  LIGHT = 'light',
  LOCK = 'lock',
  MOTION = 'motion',
  DOOR = 'door'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  BATTERY = 'battery',
  MOTION = 'motion',
  LIGHT = 'light',
  POWER = 'power'
}

export interface DeviceProperties {
  [key: string]: any;
  firmware?: string;
  model?: string;
  manufacturer?: string;
  location?: {
    x: number;
    y: number;
    floor: number;
  };
}

export interface DeviceCapability {
  name: string;
  type: 'read' | 'write' | 'notify';
  dataType: string;
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  devices: string[]; // device IDs
}

export interface DeviceCommand {
  deviceId: string;
  command: string;
  parameters: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
}