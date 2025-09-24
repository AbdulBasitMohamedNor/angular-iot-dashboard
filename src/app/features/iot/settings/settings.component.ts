import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div style="padding: 24px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Settings</mat-card-title>
          <mat-card-subtitle>IoT system configuration and preferences</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Settings component is under development. This will include:</p>
          <ul>
            <li>System configuration</li>
            <li>User preferences</li>
            <li>Connection settings</li>
            <li>Notification preferences</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class SettingsComponent {}