import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, interval, map, switchMap, filter, startWith, shareReplay, distinctUntilChanged } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { DeviceService } from './device.service';
import { 
  SensorReading, 
  SensorType, 
  DeviceDataMessage, 
  IoTDevice 
} from '../../../shared/models/iot';

export interface RealtimeMetrics {
  deviceId: string;
  latest: Record<string, SensorReading>;
  averages: Record<string, number>;
  trends: Record<string, 'up' | 'down' | 'stable'>;
  lastUpdate: Date;
}

export interface DataBuffer {
  deviceId: string;
  sensorType: string;
  readings: SensorReading[];
  maxSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeDataService {
  private wsService = inject(WebSocketService);
  private deviceService = inject(DeviceService);

  // Data buffers for each device/sensor combination
  private dataBuffers = new Map<string, DataBuffer>();
  private readonly maxBufferSize = 100; // Keep last 100 readings per sensor
  private readonly aggregationWindow = 60000; // 1 minute aggregation window

  // Real-time metrics for all devices
  private metricsSubject = new BehaviorSubject<Map<string, RealtimeMetrics>>(new Map());
  public metrics$ = this.metricsSubject.asObservable();

  // Data aggregation observables
  public deviceMetrics$ = combineLatest([
    this.deviceService.devices$,
    this.metrics$
  ]).pipe(
    map(([devices, metricsMap]) => 
      devices.map(device => ({
        device,
        metrics: metricsMap.get(device.id) || this.createEmptyMetrics(device.id)
      }))
    ),
    shareReplay(1)
  );

  // Temperature trend analysis
  public temperatureTrends$ = this.metrics$.pipe(
    map(metricsMap => {
      const trends: Array<{ deviceId: string; trend: 'up' | 'down' | 'stable'; value: number }> = [];
      
      metricsMap.forEach((metrics, deviceId) => {
        const tempReading = metrics.latest[SensorType.TEMPERATURE];
        const tempTrend = metrics.trends[SensorType.TEMPERATURE];
        
        if (tempReading && tempTrend) {
          trends.push({
            deviceId,
            trend: tempTrend,
            value: tempReading.value
          });
        }
      });
      
      return trends;
    }),
    shareReplay(1)
  );

  // System health overview
  public systemHealth$ = this.metrics$.pipe(
    map(metricsMap => {
      let totalDevices = 0;
      let devicesWithData = 0;
      let averageDataAge = 0;
      
      metricsMap.forEach(metrics => {
        totalDevices++;
        if (metrics.lastUpdate) {
          devicesWithData++;
          averageDataAge += Date.now() - metrics.lastUpdate.getTime();
        }
      });
      
      return {
        totalDevices,
        devicesWithData,
        averageDataAge: devicesWithData > 0 ? averageDataAge / devicesWithData : 0,
        healthScore: devicesWithData / totalDevices
      };
    }),
    shareReplay(1)
  );

  constructor() {
    this.initializeDataProcessing();
    this.startPeriodicAggregation();
  }

  private initializeDataProcessing(): void {
    // Process incoming device data
    this.wsService.deviceData$.subscribe(message => {
      this.processDeviceData(message);
    });

    // Initialize metrics for existing devices
    this.deviceService.devices$.subscribe(devices => {
      devices.forEach(device => {
        if (!this.metricsSubject.value.has(device.id)) {
          this.initializeDeviceMetrics(device.id);
        }
      });
    });
  }

  private processDeviceData(message: DeviceDataMessage): void {
    const { deviceId, data } = message;
    
    data.readings.forEach(reading => {
      // Add to buffer
      this.addToBuffer(reading);
      
      // Update real-time metrics
      this.updateMetrics(deviceId, reading);
      
      // Store in database
      this.deviceService.addSensorReading(reading).catch(error => {
        console.error('Error storing sensor reading:', error);
      });
    });
  }

  private addToBuffer(reading: SensorReading): void {
    const bufferKey = `${reading.deviceId}_${reading.type}`;
    
    if (!this.dataBuffers.has(bufferKey)) {
      this.dataBuffers.set(bufferKey, {
        deviceId: reading.deviceId,
        sensorType: reading.type,
        readings: [],
        maxSize: this.maxBufferSize
      });
    }
    
    const buffer = this.dataBuffers.get(bufferKey)!;
    buffer.readings.push(reading);
    
    // Keep buffer size in check
    if (buffer.readings.length > buffer.maxSize) {
      buffer.readings.shift(); // Remove oldest reading
    }
  }

  private updateMetrics(deviceId: string, reading: SensorReading): void {
    const currentMetrics = this.metricsSubject.value;
    let deviceMetrics = currentMetrics.get(deviceId);
    
    if (!deviceMetrics) {
      deviceMetrics = this.createEmptyMetrics(deviceId);
    }
    
    // Update latest reading
    deviceMetrics.latest[reading.type] = reading;
    deviceMetrics.lastUpdate = new Date();
    
    // Calculate averages and trends
    this.calculateAveragesAndTrends(deviceId, deviceMetrics);
    
    // Update the map
    const updatedMetrics = new Map(currentMetrics);
    updatedMetrics.set(deviceId, deviceMetrics);
    this.metricsSubject.next(updatedMetrics);
  }

  private calculateAveragesAndTrends(deviceId: string, metrics: RealtimeMetrics): void {
    Object.keys(metrics.latest).forEach(sensorType => {
      const bufferKey = `${deviceId}_${sensorType}`;
      const buffer = this.dataBuffers.get(bufferKey);
      
      if (buffer && buffer.readings.length > 1) {
        // Calculate average
        const sum = buffer.readings.reduce((acc, reading) => acc + reading.value, 0);
        metrics.averages[sensorType] = sum / buffer.readings.length;
        
        // Calculate trend (compare recent vs older readings)
        const recentReadings = buffer.readings.slice(-10); // Last 10 readings
        const olderReadings = buffer.readings.slice(0, 10); // First 10 readings
        
        if (recentReadings.length >= 3 && olderReadings.length >= 3) {
          const recentAvg = recentReadings.reduce((acc, r) => acc + r.value, 0) / recentReadings.length;
          const olderAvg = olderReadings.reduce((acc, r) => acc + r.value, 0) / olderReadings.length;
          
          const difference = recentAvg - olderAvg;
          const threshold = Math.abs(olderAvg * 0.05); // 5% threshold
          
          if (Math.abs(difference) < threshold) {
            metrics.trends[sensorType] = 'stable';
          } else if (difference > 0) {
            metrics.trends[sensorType] = 'up';
          } else {
            metrics.trends[sensorType] = 'down';
          }
        }
      }
    });
  }

  private initializeDeviceMetrics(deviceId: string): void {
    const currentMetrics = this.metricsSubject.value;
    if (!currentMetrics.has(deviceId)) {
      const updatedMetrics = new Map(currentMetrics);
      updatedMetrics.set(deviceId, this.createEmptyMetrics(deviceId));
      this.metricsSubject.next(updatedMetrics);
    }
  }

  private createEmptyMetrics(deviceId: string): RealtimeMetrics {
    return {
      deviceId,
      latest: {},
      averages: {},
      trends: {},
      lastUpdate: new Date()
    };
  }

  private startPeriodicAggregation(): void {
    // Aggregate data every minute
    interval(this.aggregationWindow).subscribe(() => {
      this.performDataAggregation();
    });
  }

  private performDataAggregation(): void {
    // This could include:
    // - Calculating hourly/daily averages
    // - Cleaning up old buffer data
    // - Generating alerts based on trends
    // - Compacting historical data
    
    console.log('Performing periodic data aggregation...');
    
    // Clean up old buffers (keep only recent data)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    this.dataBuffers.forEach((buffer, key) => {
      buffer.readings = buffer.readings.filter(reading => 
        reading.timestamp.getTime() > cutoffTime
      );
      
      // Remove empty buffers
      if (buffer.readings.length === 0) {
        this.dataBuffers.delete(key);
      }
    });
  }

  // Public API methods
  public getDeviceMetrics(deviceId: string): Observable<RealtimeMetrics | undefined> {
    return this.metrics$.pipe(
      map(metricsMap => metricsMap.get(deviceId)),
      distinctUntilChanged()
    );
  }

  public getLatestReading(deviceId: string, sensorType: string): SensorReading | undefined {
    const metrics = this.metricsSubject.value.get(deviceId);
    return metrics?.latest[sensorType];
  }

  public getBufferedData(deviceId: string, sensorType: string): SensorReading[] {
    const bufferKey = `${deviceId}_${sensorType}`;
    const buffer = this.dataBuffers.get(bufferKey);
    return buffer ? [...buffer.readings] : [];
  }

  public getRealtimeChart(deviceId: string, sensorType: string): Observable<SensorReading[]> {
    const bufferKey = `${deviceId}_${sensorType}`;
    
    return interval(1000).pipe( // Update every second
      startWith(0),
      map(() => {
        const buffer = this.dataBuffers.get(bufferKey);
        return buffer ? [...buffer.readings] : [];
      }),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay(1)
    );
  }

  public getAggregatedData(
    deviceId: string, 
    sensorType: string, 
    timeRange: 'hour' | 'day' | 'week'
  ): Observable<{ timestamp: Date; value: number; }[]> {
    const endTime = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case 'hour':
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return new Observable(observer => {
      this.deviceService.getDeviceReadings(deviceId, 1000, startTime, endTime)
        .then(readings => {
          const filtered = readings
            .filter(r => r.type === sensorType)
            .map(r => ({ timestamp: r.timestamp, value: r.value }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          observer.next(filtered);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  public clearDeviceData(deviceId: string): void {
    // Clear metrics
    const currentMetrics = this.metricsSubject.value;
    const updatedMetrics = new Map(currentMetrics);
    updatedMetrics.delete(deviceId);
    this.metricsSubject.next(updatedMetrics);
    
    // Clear buffers
    const keysToDelete: string[] = [];
    this.dataBuffers.forEach((buffer, key) => {
      if (buffer.deviceId === deviceId) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.dataBuffers.delete(key));
  }

  public getDataStatistics(): {
    totalBuffers: number;
    totalReadings: number;
    memoryUsage: number;
  } {
    let totalReadings = 0;
    
    this.dataBuffers.forEach(buffer => {
      totalReadings += buffer.readings.length;
    });
    
    // Rough memory estimation (in bytes)
    const memoryUsage = totalReadings * 64; // Approximate size per reading
    
    return {
      totalBuffers: this.dataBuffers.size,
      totalReadings,
      memoryUsage
    };
  }
}