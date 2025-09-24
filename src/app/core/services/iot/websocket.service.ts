import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { filter, map, takeWhile, tap } from 'rxjs/operators';
import { 
  WebSocketMessage, 
  MessageType, 
  DeviceDataMessage, 
  DeviceStatusMessage, 
  AlertMessage,
  CommandMessage 
} from '../../../shared/models/iot';

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private readonly wsUrl = 'ws://localhost:8080'; // TODO: Move to environment config
  private readonly reconnectInterval = 5000;
  private readonly maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private shouldReconnect = true;

  // Connection status
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  // Message streams
  private messageSubject = new Subject<WebSocketMessage>();
  public messages$ = this.messageSubject.asObservable();

  // Typed message streams
  public deviceData$ = this.messages$.pipe(
    filter((msg): msg is DeviceDataMessage => msg.type === MessageType.DEVICE_DATA)
  );

  public deviceStatus$ = this.messages$.pipe(
    filter((msg): msg is DeviceStatusMessage => msg.type === MessageType.DEVICE_STATUS)
  );

  public alerts$ = this.messages$.pipe(
    filter((msg): msg is AlertMessage => msg.type === MessageType.ALERT)
  );

  public commands$ = this.messages$.pipe(
    filter((msg): msg is CommandMessage => msg.type === MessageType.COMMAND)
  );

  constructor() {
    this.connect();
  }

  ngOnDestroy(): void {
    this.shouldReconnect = false;
    this.disconnect();
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatusSubject.next(ConnectionStatus.CONNECTING);

    try {
      this.ws = new WebSocket(this.wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.connectionStatusSubject.next(ConnectionStatus.ERROR);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connectionStatusSubject.next(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        // Convert timestamp string to Date if needed
        if (typeof message.timestamp === 'string') {
          message.timestamp = new Date(message.timestamp);
        }
        this.messageSubject.next(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.connectionStatusSubject.next(ConnectionStatus.DISCONNECTED);
      
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatusSubject.next(ConnectionStatus.ERROR);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionStatusSubject.next(ConnectionStatus.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.connectionStatusSubject.next(ConnectionStatus.RECONNECTING);

    setTimeout(() => {
      if (this.shouldReconnect) {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }
    }, this.reconnectInterval);
  }

  private startHeartbeat(): void {
    interval(30000) // Send heartbeat every 30 seconds
      .pipe(
        takeWhile(() => this.ws?.readyState === WebSocket.OPEN),
        tap(() => this.sendMessage({
          type: MessageType.HEARTBEAT,
          timestamp: new Date(),
          data: {}
        }))
      )
      .subscribe();
  }

  public sendMessage(message: Partial<WebSocketMessage>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return;
    }

    const fullMessage: WebSocketMessage = {
      timestamp: new Date(),
      ...message
    } as WebSocketMessage;

    try {
      this.ws.send(JSON.stringify(fullMessage));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  public sendCommand(deviceId: string, command: string, parameters: Record<string, any>): void {
    this.sendMessage({
      type: MessageType.COMMAND,
      deviceId,
      data: {
        command: {
          deviceId,
          command,
          parameters,
          timestamp: new Date(),
          status: 'pending'
        }
      }
    });
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.connectionStatusSubject.next(ConnectionStatus.DISCONNECTED);
  }

  public reconnect(): void {
    this.disconnect();
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Utility methods for filtered streams
  public getDeviceData(deviceId: string): Observable<DeviceDataMessage> {
    return this.deviceData$.pipe(
      filter(msg => msg.deviceId === deviceId)
    );
  }

  public getDeviceStatus(deviceId: string): Observable<DeviceStatusMessage> {
    return this.deviceStatus$.pipe(
      filter(msg => msg.deviceId === deviceId)
    );
  }

  public getAlertsByDevice(deviceId: string): Observable<AlertMessage> {
    return this.alerts$.pipe(
      filter(msg => msg.data.alert.deviceId === deviceId)
    );
  }

  public isConnected(): boolean {
    return this.connectionStatusSubject.value === ConnectionStatus.CONNECTED;
  }
}