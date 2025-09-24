import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div style="padding: 24px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Device Details</mat-card-title>
          <mat-card-subtitle>Detailed view and configuration for selected device</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Device details component is under development. This will show:</p>
          <ul>
            <li>Device specifications and status</li>
            <li>Real-time sensor readings</li>
            <li>Configuration settings</li>
            <li>Historical data and trends</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class DeviceDetailsComponent {}