import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, filter, tap, combineLatest } from 'rxjs';
import Dexie, { Table } from 'dexie';
import { WebSocketService } from './websocket.service';
import { DeviceService } from './device.service';
import { RealtimeDataService } from './realtime-data.service';
import { 
  Alert, 
  AlertType, 
  AlertSeverity, 
  AlertMessage,
  SensorReading,
  DeviceStatus 
} from '../../../shared/models/iot';

// Extended database for alerts
class AlertDatabase extends Dexie {
  alerts!: Table<Alert>;

  constructor() {
    super('AlertDatabase');
    this.version(1).stores({
      alerts: 'id, deviceId, type, severity, timestamp, acknowledged'
    });
  }
}

export interface AlertRule {
  id: string;
  name: string;
  deviceId: string;
  sensorType: string;
  condition: 'gt' | 'lt' | 'eq' | 'between';
  value: number | [number, number]; // single value or range
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number; // Prevent spam alerts
  lastTriggered?: Date;
}

export interface AlertStatistics {
  totalAlerts: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  alertsByType: Record<AlertType, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  recentAlerts: Alert[];
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private db = new AlertDatabase();
  private wsService = inject(WebSocketService);
  private deviceService = inject(DeviceService);
  private realtimeDataService = inject(RealtimeDataService);

  // Alert state management
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private alertRulesSubject = new BehaviorSubject<AlertRule[]>([]);
  public alertRules$ = this.alertRulesSubject.asObservable();

  // Filtered alert streams
  public unacknowledgedAlerts$ = this.alerts$.pipe(
    map(alerts => alerts.filter(alert => !alert.acknowledged))
  );

  public criticalAlerts$ = this.alerts$.pipe(
    map(alerts => alerts.filter(alert => alert.severity === AlertSeverity.CRITICAL))
  );

  public recentAlerts$ = this.alerts$.pipe(
    map(alerts => alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20)
    )
  );

  // Alert statistics
  public alertStatistics$ = this.alerts$.pipe(
    map(alerts => this.calculateAlertStatistics(alerts))
  );

  constructor() {
    this.initializeAlertProcessing();
    this.loadAlerts();
    this.loadAlertRules();
    this.startDataMonitoring();
  }

  private initializeAlertProcessing(): void {
    // Process incoming alert messages
    this.wsService.alerts$.subscribe(message => {
      this.processIncomingAlert(message);
    });

    // Monitor device status changes
    this.deviceService.devices$.subscribe(devices => {
      devices.forEach(device => {
        if (device.status === DeviceStatus.OFFLINE) {
          this.createDeviceOfflineAlert(device.id);
        }
      });
    });
  }

  private startDataMonitoring(): void {
    // Monitor real-time data for rule violations
    this.realtimeDataService.metrics$.subscribe(metricsMap => {
      metricsMap.forEach((metrics, deviceId) => {
        this.evaluateAlertRules(deviceId, metrics.latest);
      });
    });
  }

  private async processIncomingAlert(message: AlertMessage): Promise<void> {
    const alert = message.data.alert;
    
    // Convert timestamp if it's a string
    if (typeof alert.timestamp === 'string') {
      alert.timestamp = new Date(alert.timestamp);
    }

    try {
      await this.createAlert(alert);
    } catch (error) {
      console.error('Error processing incoming alert:', error);
    }
  }

  private async evaluateAlertRules(deviceId: string, latestReadings: Record<string, SensorReading>): Promise<void> {
    const rules = this.alertRulesSubject.value.filter(rule => 
      rule.deviceId === deviceId && rule.enabled
    );

    for (const rule of rules) {
      const reading = latestReadings[rule.sensorType];
      if (!reading) continue;

      // Check cooldown
      if (rule.lastTriggered && rule.cooldownMinutes > 0) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) {
          continue;
        }
      }

      const isViolation = this.evaluateCondition(reading.value, rule.condition, rule.value);
      
      if (isViolation) {
        await this.createRuleBasedAlert(rule, reading);
        
        // Update last triggered time
        await this.updateAlertRule(rule.id, { lastTriggered: new Date() });
      }
    }
  }

  private evaluateCondition(
    value: number, 
    condition: AlertRule['condition'], 
    threshold: number | [number, number]
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > (threshold as number);
      case 'lt':
        return value < (threshold as number);
      case 'eq':
        return value === (threshold as number);
      case 'between':
        const [min, max] = threshold as [number, number];
        return value < min || value > max;
      default:
        return false;
    }
  }

  private async createRuleBasedAlert(rule: AlertRule, reading: SensorReading): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      deviceId: rule.deviceId,
      type: AlertType.SENSOR_OUT_OF_RANGE,
      severity: rule.severity,
      title: `${rule.name} Alert`,
      message: `Sensor ${reading.type} value ${reading.value}${reading.unit} violates rule "${rule.name}"`,
      timestamp: new Date(),
      acknowledged: false
    };

    await this.createAlert(alert);
  }

  private async createDeviceOfflineAlert(deviceId: string): Promise<void> {
    // Check if there's already a recent offline alert for this device
    const existingAlert = this.alertsSubject.value.find(alert => 
      alert.deviceId === deviceId && 
      alert.type === AlertType.DEVICE_OFFLINE &&
      !alert.acknowledged &&
      (Date.now() - alert.timestamp.getTime()) < 5 * 60 * 1000 // Within 5 minutes
    );

    if (existingAlert) return;

    const alert: Alert = {
      id: this.generateAlertId(),
      deviceId,
      type: AlertType.DEVICE_OFFLINE,
      severity: AlertSeverity.WARNING,
      title: 'Device Offline',
      message: `Device has gone offline`,
      timestamp: new Date(),
      acknowledged: false
    };

    await this.createAlert(alert);
  }

  // Public API methods
  public async createAlert(alert: Alert): Promise<void> {
    try {
      await this.db.alerts.add(alert);
      await this.loadAlerts();
      
      // Send notification if critical
      if (alert.severity === AlertSeverity.CRITICAL) {
        this.sendCriticalAlertNotification(alert);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      await this.db.alerts.update(alertId, {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date()
      });
      await this.loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  public async deleteAlert(alertId: string): Promise<void> {
    try {
      await this.db.alerts.delete(alertId);
      await this.loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  public async clearAcknowledgedAlerts(): Promise<void> {
    try {
      await this.db.alerts.where('acknowledged').equals(1).delete(); // Use 1 instead of true for IndexedDB
      await this.loadAlerts();
    } catch (error) {
      console.error('Error clearing acknowledged alerts:', error);
      throw error;
    }
  }

  // Alert rule management
  public async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const newRule: AlertRule = {
      ...rule,
      id: this.generateRuleId()
    };

    // Store in memory (could be extended to IndexedDB if needed)
    const currentRules = this.alertRulesSubject.value;
    this.alertRulesSubject.next([...currentRules, newRule]);

    return newRule;
  }

  public async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const currentRules = this.alertRulesSubject.value;
    const updatedRules = currentRules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    this.alertRulesSubject.next(updatedRules);
  }

  public async deleteAlertRule(ruleId: string): Promise<void> {
    const currentRules = this.alertRulesSubject.value;
    const filteredRules = currentRules.filter(rule => rule.id !== ruleId);
    this.alertRulesSubject.next(filteredRules);
  }

  // Filtered alert queries
  public getDeviceAlerts(deviceId: string): Observable<Alert[]> {
    return this.alerts$.pipe(
      map(alerts => alerts.filter(alert => alert.deviceId === deviceId))
    );
  }

  public getAlertsByType(type: AlertType): Observable<Alert[]> {
    return this.alerts$.pipe(
      map(alerts => alerts.filter(alert => alert.type === type))
    );
  }

  public getAlertsBySeverity(severity: AlertSeverity): Observable<Alert[]> {
    return this.alerts$.pipe(
      map(alerts => alerts.filter(alert => alert.severity === severity))
    );
  }

  public getAlertsInTimeRange(startDate: Date, endDate: Date): Observable<Alert[]> {
    return this.alerts$.pipe(
      map(alerts => alerts.filter(alert => 
        alert.timestamp >= startDate && alert.timestamp <= endDate
      ))
    );
  }

  // Batch operations
  public async acknowledgeMultipleAlerts(alertIds: string[], acknowledgedBy: string): Promise<void> {
    try {
      for (const alertId of alertIds) {
        await this.acknowledgeAlert(alertId, acknowledgedBy);
      }
    } catch (error) {
      console.error('Error acknowledging multiple alerts:', error);
      throw error;
    }
  }

  public async exportAlerts(format: 'json' | 'csv' = 'json'): Promise<string> {
    const alerts = this.alertsSubject.value;
    
    if (format === 'csv') {
      const headers = ['ID', 'Device ID', 'Type', 'Severity', 'Title', 'Message', 'Timestamp', 'Acknowledged'];
      const rows = alerts.map(alert => [
        alert.id,
        alert.deviceId,
        alert.type,
        alert.severity,
        alert.title,
        alert.message,
        alert.timestamp.toISOString(),
        alert.acknowledged.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(alerts, null, 2);
  }

  // Private helper methods
  private async loadAlerts(): Promise<void> {
    try {
      const alerts = await this.db.alerts
        .orderBy('timestamp')
        .reverse()
        .toArray();
      
      // Convert timestamp strings to Date objects if needed
      const processedAlerts = alerts.map(alert => ({
        ...alert,
        timestamp: typeof alert.timestamp === 'string' ? new Date(alert.timestamp) : alert.timestamp,
        acknowledgedAt: alert.acknowledgedAt && typeof alert.acknowledgedAt === 'string' 
          ? new Date(alert.acknowledgedAt) 
          : alert.acknowledgedAt
      }));
      
      this.alertsSubject.next(processedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  private async loadAlertRules(): Promise<void> {
    // For now, initialize with default rules
    // This could be extended to load from IndexedDB or configuration
    const defaultRules: AlertRule[] = [
      {
        id: 'temp_high',
        name: 'High Temperature',
        deviceId: '*', // Applies to all devices
        sensorType: 'temperature',
        condition: 'gt',
        value: 30,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownMinutes: 15
      },
      {
        id: 'battery_low',
        name: 'Low Battery',
        deviceId: '*',
        sensorType: 'battery',
        condition: 'lt',
        value: 20,
        severity: AlertSeverity.ERROR,
        enabled: true,
        cooldownMinutes: 60
      }
    ];
    
    this.alertRulesSubject.next(defaultRules);
  }

  private calculateAlertStatistics(alerts: Alert[]): AlertStatistics {
    const statistics: AlertStatistics = {
      totalAlerts: alerts.length,
      unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length,
      criticalAlerts: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      alertsByType: {} as Record<AlertType, number>,
      alertsBySeverity: {} as Record<AlertSeverity, number>,
      recentAlerts: alerts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10)
    };

    // Count by type
    Object.values(AlertType).forEach(type => {
      statistics.alertsByType[type] = alerts.filter(a => a.type === type).length;
    });

    // Count by severity
    Object.values(AlertSeverity).forEach(severity => {
      statistics.alertsBySeverity[severity] = alerts.filter(a => a.severity === severity).length;
    });

    return statistics;
  }

  private sendCriticalAlertNotification(alert: Alert): void {
    // This could be extended with actual notification systems
    // For now, just log the critical alert
    console.warn('CRITICAL ALERT:', alert.title, '-', alert.message);
    
    // Could implement:
    // - Browser notifications
    // - Email notifications
    // - Push notifications
    // - Slack/Teams integration
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Cleanup methods
  public async clearAllAlerts(): Promise<void> {
    try {
      await this.db.alerts.clear();
      this.alertsSubject.next([]);
    } catch (error) {
      console.error('Error clearing all alerts:', error);
      throw error;
    }
  }

  public async cleanupOldAlerts(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      await this.db.alerts.where('timestamp').below(cutoffDate).delete();
      await this.loadAlerts();
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
      throw error;
    }
  }
}