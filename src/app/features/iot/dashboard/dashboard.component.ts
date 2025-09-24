import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, takeUntil, combineLatest, map, startWith } from 'rxjs';

// Services
import { WebSocketService, ConnectionStatus } from '../../../core/services/iot/websocket.service';
import { DeviceService } from '../../../core/services/iot/device.service';
import { RealtimeDataService } from '../../../core/services/iot/realtime-data.service';
import { AlertService } from '../../../core/services/iot/alert.service';
import { ThemeService } from '../../../core/services/theme.service';

// Components
import { TimeSeriesChartComponent, TimeSeriesDataPoint } from '../../../shared/components/iot/time-series-chart/time-series-chart.component';
import { GaugeChartComponent } from '../../../shared/components/iot/gauge-chart/gauge-chart.component';

// Models
import { IoTDevice, DeviceStatus, SensorType, AlertSeverity } from '../../../shared/models/iot';

interface StatData {
  label: string;
  value: number;
  icon: string;
  status: string;
  trend: 'up' | 'down';
  change: number;
  badge?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatGridListModule,
    MatSlideToggleModule,
    TimeSeriesChartComponent,
    GaugeChartComponent
  ],
  template: `
    <!-- Animated Background -->
    <div class="animated-background"></div>
    
    <div class="modern-dashboard">
      <!-- Header Section -->
      <header class="dashboard-header glass-card">
        <div class="header-content">
          <div class="title-section">
            <div class="logo-container">
              <mat-icon class="logo-icon">hub</mat-icon>
            </div>
            <div class="title-text">
              <h1 class="dashboard-title text-gradient">IoT Control Center</h1>
              <p class="dashboard-subtitle">Real-time monitoring & analytics</p>
            </div>
          </div>
          
          <div class="header-controls">
            <!-- Connection Status -->
            <div class="connection-status">
              <mat-chip [class]="'status-chip status-' + connectionStatus().toLowerCase()">
                <mat-icon>{{ connectionIcon() }}</mat-icon>
                {{ connectionText() }}
              </mat-chip>
            </div>
            
            <!-- Theme Toggle -->
            <div class="theme-toggle">
              <mat-icon>{{ themeService.isDark() ? 'dark_mode' : 'light_mode' }}</mat-icon>
              <mat-slide-toggle 
                [checked]="themeService.isDark()"
                (change)="themeService.toggleTheme()"
                color="primary">
              </mat-slide-toggle>
            </div>
          </div>
        </div>
      </header>

      <!-- Stats Overview -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card glass-card" *ngFor="let stat of statsData()">
            <div class="stat-content">
              <div class="stat-icon" [class]="'stat-' + stat.status">
                <mat-icon [matBadge]="stat.badge" [matBadgeHidden]="!stat.badge" matBadgeColor="warn">
                  {{ stat.icon }}
                </mat-icon>
              </div>
              <div class="stat-details">
                <div class="stat-number">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" [class]="'trend-' + stat.trend">
                  <mat-icon>{{ stat.trend === 'up' ? 'trending_up' : 'trending_down' }}</mat-icon>
                  {{ stat.change }}%
                </div>
              </div>
            </div>
            <div class="stat-sparkline pulse-animation"></div>
          </div>
        </div>
      </section>

      <!-- Main Dashboard Grid -->
      <main class="dashboard-main">
        <div class="responsive-grid">
          
          <!-- Temperature Overview Card -->
          <div class="dashboard-card glass-card feature-card">
            <div class="card-header">
              <h3 class="card-title">
                <mat-icon>thermostat</mat-icon>
                Temperature Control
              </h3>
              <div class="card-actions">
                <button mat-icon-button matTooltip="Refresh Data">
                  <mat-icon>refresh</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Settings">
                  <mat-icon>settings</mat-icon>
                </button>
              </div>
            </div>
            <div class="card-content">
              <div class="temperature-grid">
                <div class="temp-gauge-container">
                  <app-gauge-chart
                    [value]="indoorTemperature()"
                    [config]="{
                      title: 'Indoor',
                      min: 0,
                      max: 40,
                      unit: '°C',
                      style: 'modern',
                      thresholds: { low: 18, medium: 22, high: 28 },
                      size: 'large',
                      showProgress: true,
                      animated: true
                    }">
                  </app-gauge-chart>
                </div>
                <div class="temp-gauge-container">
                  <app-gauge-chart
                    [value]="outdoorTemperature()"
                    [config]="{
                      title: 'Outdoor',
                      min: -10,
                      max: 45,
                      unit: '°C',
                      style: 'gradient',
                      thresholds: { low: 10, medium: 20, high: 35 },
                      size: 'large',
                      showProgress: true,
                      animated: true
                    }">
                  </app-gauge-chart>
                </div>
              </div>
            </div>
          </div>

          <!-- Environmental Monitoring -->
          <div class="dashboard-card glass-card">
            <div class="card-header">
              <h3 class="card-title">
                <mat-icon>eco</mat-icon>
                Environment
              </h3>
            </div>
            <div class="card-content">
              <div class="env-metrics">
                <div class="metric-item">
                  <app-gauge-chart
                    [value]="humidity()"
                    [config]="{
                      title: 'Humidity',
                      min: 0,
                      max: 100,
                      unit: '%',
                      style: 'minimalist',
                      thresholds: { low: 30, medium: 50, high: 70 },
                      size: 'medium',
                      showProgress: false,
                      animated: true
                    }">
                  </app-gauge-chart>
                </div>
                <div class="metric-item">
                  <app-gauge-chart
                    [value]="airQuality()"
                    [config]="{
                      title: 'Air Quality',
                      min: 0,
                      max: 500,
                      unit: 'AQI',
                      style: 'professional',
                      thresholds: { low: 50, medium: 100, high: 150 },
                      size: 'medium',
                      showProgress: false,
                      animated: true
                    }">
                  </app-gauge-chart>
                </div>
              </div>
            </div>
          </div>

          <!-- System Health -->
          <div class="dashboard-card glass-card">
            <div class="card-header">
              <h3 class="card-title">
                <mat-icon>memory</mat-icon>
                System Health
              </h3>
            </div>
            <div class="card-content">
              <div class="health-metrics">
                <div class="health-item">
                  <div class="health-label">CPU Usage</div>
                  <div class="health-bar">
                    <div class="health-progress" [style.width.%]="cpuUsage()"></div>
                  </div>
                  <div class="health-value">{{ cpuUsage() }}%</div>
                </div>
                <div class="health-item">
                  <div class="health-label">Memory</div>
                  <div class="health-bar">
                    <div class="health-progress" [style.width.%]="memoryUsage()"></div>
                  </div>
                  <div class="health-value">{{ memoryUsage() }}%</div>
                </div>
                <div class="health-item">
                  <div class="health-label">Network</div>
                  <div class="health-bar">
                    <div class="health-progress" [style.width.%]="networkUsage()"></div>
                  </div>
                  <div class="health-value">{{ networkUsage() }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Real-time Charts -->
          <div class="dashboard-card glass-card chart-card-large">
            <div class="card-header">
              <h3 class="card-title">
                <mat-icon>timeline</mat-icon>
                Real-time Analytics
              </h3>
              <div class="card-actions">
                <mat-chip-listbox>
                  <mat-chip-option selected>1H</mat-chip-option>
                  <mat-chip-option>6H</mat-chip-option>
                  <mat-chip-option>24H</mat-chip-option>
                  <mat-chip-option>7D</mat-chip-option>
                </mat-chip-listbox>
              </div>
            </div>
            <div class="card-content">
              <app-time-series-chart
                [data]="temperatureData()"
                [config]="{
                  title: '',
                  yAxisLabel: 'Temperature',
                  unit: '°C',
                  showGrid: true,
                  showDataZoom: true,
                  smoothLine: true,
                  primaryColor: 'var(--primary-color)',
                  height: '350px'
                }"
                [realtime]="true"
                [loading]="isLoadingData()">
              </app-time-series-chart>
            </div>
          </div>

          <!-- Device Grid -->
          <div class="dashboard-card glass-card device-grid-card">
            <div class="card-header">
              <h3 class="card-title">
                <mat-icon>devices</mat-icon>
                Connected Devices
              </h3>
              <div class="device-summary">
                {{ deviceService.onlineDevices() }} / {{ deviceService.totalDevices() }} online
              </div>
            </div>
            <div class="card-content">
              <div class="device-grid">
                <div class="device-item" *ngFor="let device of connectedDevices()">
                  <div class="device-status" [class]="'status-' + device.status.toLowerCase()"></div>
                  <div class="device-info">
                    <div class="device-name">{{ device.name }}</div>
                    <div class="device-type">{{ device.type }}</div>
                  </div>
                  <div class="device-value">
                    {{ device.lastValue }}{{ device.unit }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alerts Panel -->
          <div class="dashboard-card glass-card alerts-card">
            <div class="card-header">
              <h3 class="card-title">
                <mat-icon [matBadge]="unacknowledgedAlerts()" matBadgeColor="warn">notifications</mat-icon>
                System Alerts
              </h3>
            </div>
            <div class="card-content">
              <div class="alerts-list" *ngIf="recentAlerts().length > 0; else noAlerts">
                <div class="alert-item" *ngFor="let alert of recentAlerts()">
                  <div class="alert-severity" [class]="'severity-' + alert.severity.toLowerCase()">
                    <mat-icon>{{ getAlertIcon(alert.severity) }}</mat-icon>
                  </div>
                  <div class="alert-content">
                    <div class="alert-message">{{ alert.message }}</div>
                    <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
                  </div>
                  <button mat-icon-button class="alert-action">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>
              <ng-template #noAlerts>
                <div class="no-alerts">
                  <mat-icon>check_circle</mat-icon>
                  <p>All systems operational</p>
                </div>
              </ng-template>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .modern-dashboard {
      min-height: 100vh;
      background: var(--bg-primary);
      padding: 24px;
      position: relative;
      z-index: 1;
    }

    /* Header Styles */
    .dashboard-header {
      margin-bottom: 32px;
      padding: 24px 32px;
      position: sticky;
      top: 24px;
      z-index: 10;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-container {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon {
      color: white;
      font-size: 24px;
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }

    .dashboard-subtitle {
      color: var(--text-secondary);
      margin: 4px 0 0 0;
      font-size: 0.95rem;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-chip {
      font-weight: 500;
    }

    .status-chip.status-connected {
      background: var(--success-color);
      color: white;
    }

    .status-chip.status-disconnected {
      background: var(--error-color);
      color: white;
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .stat-card {
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .stat-icon.stat-online {
      background: linear-gradient(135deg, var(--success-color), #34d399);
      color: white;
    }

    .stat-icon.stat-warning {
      background: linear-gradient(135deg, var(--warning-color), #fbbf24);
      color: white;
    }

    .stat-icon.stat-error {
      background: linear-gradient(135deg, var(--error-color), #f87171);
      color: white;
    }

    .stat-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .stat-number {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      margin-top: 8px;
      font-weight: 500;
    }

    .stat-trend.trend-up {
      color: var(--success-color);
    }

    .stat-trend.trend-down {
      color: var(--error-color);
    }

    .stat-sparkline {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 60px;
      height: 20px;
      background: linear-gradient(90deg, transparent, var(--primary-color));
      opacity: 0.2;
    }

    /* Dashboard Main Grid */
    .dashboard-main .responsive-grid {
      grid-template-columns: repeat(12, 1fr);
      gap: 24px;
    }

    .dashboard-card {
      padding: 0;
      overflow: hidden;
    }

    .feature-card {
      grid-column: span 8;
    }

    .chart-card-large {
      grid-column: span 12;
    }

    .device-grid-card {
      grid-column: span 7;
    }

    .alerts-card {
      grid-column: span 5;
    }

    .card-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }

    .card-content {
      padding: 24px;
    }

    /* Temperature Grid */
    .temperature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    .temp-gauge-container {
      display: flex;
      justify-content: center;
    }

    /* Environment Metrics */
    .env-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .metric-item {
      display: flex;
      justify-content: center;
    }

    /* Health Metrics */
    .health-metrics {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .health-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .health-label {
      min-width: 80px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .health-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .health-progress {
      height: 100%;
      background: linear-gradient(90deg, var(--success-color), var(--primary-color));
      transition: width 0.3s ease;
    }

    .health-value {
      min-width: 40px;
      text-align: right;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Device Grid */
    .device-summary {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .device-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .device-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      gap: 12px;
      transition: var(--transition-fast);
    }

    .device-item:hover {
      background: var(--bg-card-hover);
      border-color: var(--primary-color);
    }

    .device-status {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .device-status.status-online {
      background: var(--success-color);
      box-shadow: 0 0 6px var(--success-color);
    }

    .device-status.status-offline {
      background: var(--text-muted);
    }

    .device-info {
      flex: 1;
    }

    .device-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .device-type {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .device-value {
      font-weight: 600;
      color: var(--primary-color);
    }

    /* Alerts */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      border-left: 4px solid;
      background: var(--bg-card);
      transition: var(--transition-fast);
    }

    .alert-item:hover {
      background: var(--bg-card-hover);
    }

    .alert-item.severity-error {
      border-left-color: var(--error-color);
    }

    .alert-item.severity-warning {
      border-left-color: var(--warning-color);
    }

    .alert-item.severity-info {
      border-left-color: var(--primary-color);
    }

    .alert-severity mat-icon {
      font-size: 18px;
    }

    .alert-content {
      flex: 1;
    }

    .alert-message {
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .alert-time {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .no-alerts {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
    }

    .no-alerts mat-icon {
      font-size: 48px;
      color: var(--success-color);
      margin-bottom: 16px;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .feature-card {
        grid-column: span 12;
      }

      .device-grid-card,
      .alerts-card {
        grid-column: span 6;
      }
    }

    @media (max-width: 768px) {
      .modern-dashboard {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .dashboard-title {
        font-size: 1.5rem;
        text-align: center;
      }

      .temperature-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .env-metrics {
        grid-template-columns: 1fr;
      }

      .device-grid-card,
      .alerts-card {
        grid-column: span 12;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  deviceService = inject(DeviceService);
  private webSocketService = inject(WebSocketService);
  private realtimeDataService = inject(RealtimeDataService);
  private alertService = inject(AlertService);
  themeService = inject(ThemeService);
  
  // Loading state
  isLoadingData = signal(true);
  
  // Connection status
  connectionStatus = computed(() => {
    // Mock connection status for now
    return ConnectionStatus.CONNECTED;
  });
  connectionText = computed(() => this.getConnectionText());
  connectionIcon = computed(() => this.getConnectionIcon());
  
  // Temperature data
  indoorTemperature = signal(22.5);
  outdoorTemperature = signal(18.2);
  humidity = signal(65);
  airQuality = signal(85);
  
  // System metrics
  cpuUsage = signal(45);
  memoryUsage = signal(68);
  networkUsage = signal(32);
  
  // Chart data
  temperatureData = computed<TimeSeriesDataPoint[]>(() => [
    // Mock data for demonstration
    { timestamp: new Date(Date.now() - 3600000), value: 20.5 },
    { timestamp: new Date(Date.now() - 1800000), value: 21.2 },
    { timestamp: new Date(Date.now() - 900000), value: 22.1 },
    { timestamp: new Date(Date.now()), value: this.indoorTemperature() }
  ]);
  
  // Stats data
  statsData = computed<StatData[]>(() => [
    {
      label: 'Total Devices',
      value: this.deviceService.totalDevices(),
      icon: 'devices',
      status: 'online',
      trend: 'up',
      change: 5
    },
    {
      label: 'Online Devices',
      value: this.deviceService.onlineDevices(),
      icon: 'wifi',
      status: 'online',
      trend: 'up',
      change: 2
    },
    {
      label: 'Offline Devices',
      value: this.deviceService.offlineDevices(),
      icon: 'wifi_off',
      status: 'error',
      trend: 'down',
      change: 1
    },
    {
      label: 'Active Alerts',
      value: this.unacknowledgedAlerts(),
      icon: 'notifications',
      status: 'warning',
      trend: 'down',
      change: 3,
      badge: this.unacknowledgedAlerts()
    }
  ]);
  
  // Alerts - Mock data
  unacknowledgedAlerts = signal(3);
  
  recentAlerts = signal([
    {
      id: '1',
      message: 'Temperature sensor offline',
      severity: AlertSeverity.WARNING,
      timestamp: Date.now() - 300000,
      deviceId: 'temp-01'
    },
    {
      id: '2',
      message: 'High CPU usage detected',
      severity: AlertSeverity.ERROR,
      timestamp: Date.now() - 600000,
      deviceId: 'cpu-monitor'
    }
  ]);
  
  // Connected devices - Mock data
  connectedDevices = signal([
    { name: 'Living Room Sensor', type: 'Temperature', status: DeviceStatus.ONLINE, lastValue: 22.5, unit: '°C' },
    { name: 'Kitchen Sensor', type: 'Humidity', status: DeviceStatus.ONLINE, lastValue: 65, unit: '%' },
    { name: 'Bedroom Sensor', type: 'Temperature', status: DeviceStatus.OFFLINE, lastValue: 20.1, unit: '°C' },
    { name: 'Outdoor Sensor', type: 'Weather', status: DeviceStatus.ONLINE, lastValue: 18.2, unit: '°C' }
  ]);

  ngOnInit() {
    // Initialize real-time data subscriptions
    this.initializeDataSubscriptions();
    
    // Simulate loading
    setTimeout(() => {
      this.isLoadingData.set(false);
    }, 2000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDataSubscriptions() {
    // Mock real-time data updates
    setInterval(() => {
      this.indoorTemperature.set(20 + Math.random() * 5);
      this.outdoorTemperature.set(15 + Math.random() * 8);
      this.humidity.set(60 + Math.random() * 10);
      this.airQuality.set(80 + Math.random() * 20);
      this.cpuUsage.set(40 + Math.random() * 20);
      this.memoryUsage.set(60 + Math.random() * 15);
      this.networkUsage.set(30 + Math.random() * 10);
    }, 5000);
  }

  private getConnectionText(): string {
    const status = this.connectionStatus();
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }

  private getConnectionIcon(): string {
    const status = this.connectionStatus();
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'cloud_done';
      case ConnectionStatus.CONNECTING:
        return 'cloud_sync';
      case ConnectionStatus.DISCONNECTED:
        return 'cloud_off';
      default:
        return 'help_outline';
    }
  }

  getAlertIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.ERROR:
        return 'error';
      case AlertSeverity.WARNING:
        return 'warning';
      case AlertSeverity.INFO:
        return 'info';
      case AlertSeverity.CRITICAL:
        return 'dangerous';
      default:
        return 'notifications';
    }
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}