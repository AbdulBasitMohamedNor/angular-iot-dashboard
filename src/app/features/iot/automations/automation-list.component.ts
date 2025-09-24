import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-automation-list',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div style="padding: 24px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Automation Rules</mat-card-title>
          <mat-card-subtitle>Manage automated responses and triggers</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Automation list component is under development. This will include:</p>
          <ul>
            <li>List of all automation rules</li>
            <li>Rule status and execution history</li>
            <li>Enable/disable automations</li>
            <li>Create new automation rules</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class AutomationListComponent {}