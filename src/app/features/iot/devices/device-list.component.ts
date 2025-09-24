import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div style="padding: 24px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Device Management</mat-card-title>
          <mat-card-subtitle>Manage and monitor your IoT devices</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Device list component is under development. This will show:</p>
          <ul>
            <li>All connected IoT devices</li>
            <li>Device status and health</li>
            <li>Device configuration options</li>
            <li>Add/remove devices</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class DeviceListComponent {}