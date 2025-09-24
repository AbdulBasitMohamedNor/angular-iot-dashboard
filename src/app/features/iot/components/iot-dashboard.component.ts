import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorCardComponent } from './sensor-card.component';
import { AlertPanelComponent } from './alert-panel.component';
import { IotDataService } from '../services/iot-data.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-iot-dashboard',
  standalone: true,
  imports: [CommonModule, SensorCardComponent, AlertPanelComponent],
  template: `
    <div class="industrial-dashboard">
      <!-- Header -->
      <div class="header">
        <h1>Industrial Control Center</h1>
      </div>

      <!-- Sensor Grid -->
      <div class="grid">
        @for (sensor of iotService.sensorsData(); track sensor.id) {
          <app-sensor-card
            [sensorData]="sensor"
            (controlClick)="onControlClick($event)"
          />
        }
      </div>

      <!-- Alert Panel -->
      <div class="alert-section">
        <app-alert-panel [alerts]="iotService.alertsData()" />
      </div>
    </div>
  `,
  styles: [`
    .industrial-dashboard {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #0a0f1c 0%, #1a1f2e 100%);
      color: #ffffff;
      padding: 20px;
      min-height: 100vh;
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      color: #64ffda;
      text-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
      margin: 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
      margin-bottom: 30px;
      max-width: 1300px;
      margin-left: auto;
      margin-right: auto;
      align-items: start;
    }

    .alert-section {
      max-width: 1300px;
      margin: 0 auto;
    }

    @media (max-width: 1200px) {
      .grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 25px;
      }
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
        gap: 20px;
        margin-left: 0;
        margin-right: 0;
      }
      
      .header h1 {
        font-size: 2rem;
      }

      .industrial-dashboard {
        padding: 15px;
        max-width: 100vw;
      }

      .alert-section {
        margin-left: 0;
        margin-right: 0;
      }
    }
  `]
})
export class IotDashboardComponent {
  readonly iotService = inject(IotDataService);
  readonly themeService = inject(ThemeService);

  onControlClick(event: { sensorId: string; controlId: string }): void {
    this.iotService.updateSensorControl(event.sensorId, event.controlId);
  }
}