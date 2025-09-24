import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-automation-editor',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div style="padding: 24px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Automation Editor</mat-card-title>
          <mat-card-subtitle>Create and edit automation rules</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Automation editor component is under development. This will feature:</p>
          <ul>
            <li>Visual rule builder</li>
            <li>Trigger and action configuration</li>
            <li>Rule testing and validation</li>
            <li>Schedule and condition settings</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class AutomationEditorComponent {}