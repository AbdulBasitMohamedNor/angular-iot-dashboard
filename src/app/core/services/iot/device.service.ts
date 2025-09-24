import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, from, map, switchMap, catchError, of, combineLatest } from 'rxjs';
import Dexie, { Table } from 'dexie';
import { 
  IoTDevice, 
  SensorReading, 
  DeviceStatus, 
  DeviceType, 
  Room,
  DeviceCommand 
} from '../../../shared/models/iot';

// IndexedDB Schema
class IoTDatabase extends Dexie {
  devices!: Table<IoTDevice>;
  readings!: Table<SensorReading>;
  rooms!: Table<Room>;
  commands!: Table<DeviceCommand>;

  constructor() {
    super('IoTDatabase');
    this.version(1).stores({
      devices: 'id, name, type, room, status, lastSeen',
      readings: '++, deviceId, timestamp, type',
      rooms: 'id, name, floor',
      commands: '++, deviceId, timestamp, status'
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private db = new IoTDatabase();
  
  // Reactive signals for device state
  private devicesSubject = new BehaviorSubject<IoTDevice[]>([]);
  public devices$ = this.devicesSubject.asObservable();
  
  private roomsSubject = new BehaviorSubject<Room[]>([]);
  public rooms$ = this.roomsSubject.asObservable();

  // Computed signals
  public totalDevices = signal(0);
  public onlineDevices = signal(0);
  public offlineDevices = signal(0);
  public devicesWithWarnings = signal(0);

  constructor() {
    this.loadDevices();
    this.loadRooms();
    this.updateDeviceStats();
  }

  // Device CRUD Operations
  async createDevice(device: Omit<IoTDevice, 'id' | 'lastSeen'>): Promise<IoTDevice> {
    const newDevice: IoTDevice = {
      ...device,
      id: this.generateDeviceId(),
      lastSeen: new Date()
    };

    try {
      await this.db.devices.add(newDevice);
      await this.loadDevices();
      return newDevice;
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  }

  async updateDevice(id: string, updates: Partial<IoTDevice>): Promise<void> {
    try {
      await this.db.devices.update(id, updates);
      await this.loadDevices();
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  async deleteDevice(id: string): Promise<void> {
    try {
      await this.db.devices.delete(id);
      // Also delete related readings and commands
      await this.db.readings.where('deviceId').equals(id).delete();
      await this.db.commands.where('deviceId').equals(id).delete();
      await this.loadDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  async getDevice(id: string): Promise<IoTDevice | undefined> {
    try {
      return await this.db.devices.get(id);
    } catch (error) {
      console.error('Error getting device:', error);
      return undefined;
    }
  }

  // Device filtering and searching
  getDevicesByRoom(roomId: string): Observable<IoTDevice[]> {
    return this.devices$.pipe(
      map(devices => devices.filter(device => device.room === roomId))
    );
  }

  getDevicesByType(type: DeviceType): Observable<IoTDevice[]> {
    return this.devices$.pipe(
      map(devices => devices.filter(device => device.type === type))
    );
  }

  getDevicesByStatus(status: DeviceStatus): Observable<IoTDevice[]> {
    return this.devices$.pipe(
      map(devices => devices.filter(device => device.status === status))
    );
  }

  searchDevices(query: string): Observable<IoTDevice[]> {
    return this.devices$.pipe(
      map(devices => devices.filter(device => 
        device.name.toLowerCase().includes(query.toLowerCase()) ||
        device.room.toLowerCase().includes(query.toLowerCase()) ||
        device.type.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }

  // Sensor reading operations
  async addSensorReading(reading: SensorReading): Promise<void> {
    try {
      await this.db.readings.add(reading);
      // Update device's last seen timestamp
      await this.updateDevice(reading.deviceId, { lastSeen: reading.timestamp });
    } catch (error) {
      console.error('Error adding sensor reading:', error);
      throw error;
    }
  }

  async getDeviceReadings(
    deviceId: string, 
    limit: number = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<SensorReading[]> {
    try {
      let query = this.db.readings.where('deviceId').equals(deviceId);

      if (startDate) {
        query = query.and(reading => reading.timestamp >= startDate);
      }
      
      if (endDate) {
        query = query.and(reading => reading.timestamp <= endDate);
      }

      return await query
        .reverse()
        .sortBy('timestamp')
        .then(results => results.slice(0, limit));
    } catch (error) {
      console.error('Error getting device readings:', error);
      return [];
    }
  }

  async getLatestReading(deviceId: string, sensorType?: string): Promise<SensorReading | undefined> {
    try {
      let query = this.db.readings.where('deviceId').equals(deviceId);
      
      if (sensorType) {
        query = query.and(reading => reading.type === sensorType);
      }

      return await query
        .reverse()
        .sortBy('timestamp')
        .then(results => results[0]);
    } catch (error) {
      console.error('Error getting latest reading:', error);
      return undefined;
    }
  }

  // Room management
  async createRoom(room: Room): Promise<void> {
    try {
      await this.db.rooms.add(room);
      await this.loadRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<void> {
    try {
      await this.db.rooms.update(id, updates);
      await this.loadRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  async deleteRoom(id: string): Promise<void> {
    try {
      // Check if room has devices
      const devicesInRoom = await this.db.devices.where('room').equals(id).count();
      if (devicesInRoom > 0) {
        throw new Error('Cannot delete room with devices. Move devices first.');
      }
      
      await this.db.rooms.delete(id);
      await this.loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  // Command history
  async addCommand(command: DeviceCommand): Promise<void> {
    try {
      await this.db.commands.add(command);
    } catch (error) {
      console.error('Error adding command:', error);
      throw error;
    }
  }

  async getDeviceCommands(deviceId: string, limit: number = 50): Promise<DeviceCommand[]> {
    try {
      return await this.db.commands
        .where('deviceId')
        .equals(deviceId)
        .reverse()
        .sortBy('timestamp')
        .then(results => results.slice(0, limit));
    } catch (error) {
      console.error('Error getting device commands:', error);
      return [];
    }
  }

  // Device status updates
  async updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<void> {
    await this.updateDevice(deviceId, { 
      status, 
      lastSeen: new Date() 
    });
  }

  // Bulk operations
  async importDevices(devices: IoTDevice[]): Promise<void> {
    try {
      await this.db.devices.bulkAdd(devices);
      await this.loadDevices();
    } catch (error) {
      console.error('Error importing devices:', error);
      throw error;
    }
  }

  async exportDevices(): Promise<IoTDevice[]> {
    try {
      return await this.db.devices.toArray();
    } catch (error) {
      console.error('Error exporting devices:', error);
      return [];
    }
  }

  // Private helper methods
  private async loadDevices(): Promise<void> {
    try {
      const devices = await this.db.devices.orderBy('name').toArray();
      this.devicesSubject.next(devices);
      this.updateDeviceStats();
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  private async loadRooms(): Promise<void> {
    try {
      const rooms = await this.db.rooms.orderBy('name').toArray();
      this.roomsSubject.next(rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }

  private updateDeviceStats(): void {
    const devices = this.devicesSubject.value;
    
    this.totalDevices.set(devices.length);
    this.onlineDevices.set(devices.filter(d => d.status === DeviceStatus.ONLINE).length);
    this.offlineDevices.set(devices.filter(d => d.status === DeviceStatus.OFFLINE).length);
    this.devicesWithWarnings.set(devices.filter(d => d.status === DeviceStatus.WARNING).length);
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Utility methods
  public async clearAllData(): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.devices, this.db.readings, this.db.rooms, this.db.commands, async () => {
        await this.db.devices.clear();
        await this.db.readings.clear();
        await this.db.rooms.clear();
        await this.db.commands.clear();
      });
      
      this.devicesSubject.next([]);
      this.roomsSubject.next([]);
      this.updateDeviceStats();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  public async getDatabaseInfo(): Promise<{
    deviceCount: number;
    readingCount: number;
    roomCount: number;
    commandCount: number;
  }> {
    try {
      const [deviceCount, readingCount, roomCount, commandCount] = await Promise.all([
        this.db.devices.count(),
        this.db.readings.count(),
        this.db.rooms.count(),
        this.db.commands.count()
      ]);

      return { deviceCount, readingCount, roomCount, commandCount };
    } catch (error) {
      console.error('Error getting database info:', error);
      return { deviceCount: 0, readingCount: 0, roomCount: 0, commandCount: 0 };
    }
  }
}