import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert } from '../models/sensor.model';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert-panel">
      <div class="panel-header">
        <h3>System Alerts</h3>
        <div class="alert-count">{{ alerts().length }}</div>
      </div>
      
      <div class="alerts-container">
        @if (alerts().length === 0) {
          <div class="no-alerts">
            <div class="success-icon">✓</div>
            <div class="success-text">All systems operational</div>
          </div>
        } @else {
          @for (alert of alerts(); track alert.id) {
            <div class="alert-item" [class]="alert.type">
              <div class="alert-icon">
                {{ alert.icon }}
              </div>
              <div class="alert-content">
                <div class="alert-message">{{ alert.title }}</div>
                <div class="alert-timestamp">{{ getTimeAgo(alert.timestamp) }}</div>
              </div>
              <div class="alert-status" [style.background]="getAlertColor(alert.type)">
                {{ alert.type }}
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .alert-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 25px;
      height: 400px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .alert-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #64ffda, transparent);
      opacity: 0.6;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .panel-header h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
    }

    .alert-count {
      background: #64ffda;
      color: #000;
      padding: 5px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      min-width: 24px;
      text-align: center;
    }

    .alerts-container {
      flex: 1;
      overflow-y: auto;
      padding-right: 5px;
      margin-right: -5px;
    }

    .alerts-container::-webkit-scrollbar {
      width: 4px;
    }

    .alerts-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
    }

    .alerts-container::-webkit-scrollbar-thumb {
      background: rgba(100, 255, 218, 0.3);
      border-radius: 2px;
    }

    .alerts-container::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 255, 218, 0.5);
    }

    .no-alerts {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #64ffda;
      text-align: center;
    }

    .success-icon {
      font-size: 3rem;
      margin-bottom: 15px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(100, 255, 218, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    .success-text {
      font-size: 1.1rem;
      font-weight: 500;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      transition: all 0.3s ease;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .alert-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateX(5px);
    }

    .alert-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }

    .alert-item.critical .alert-icon {
      background: linear-gradient(135deg, #f44336, #d32f2f);
    }

    .alert-item.warning .alert-icon {
      background: linear-gradient(135deg, #ff9800, #f57c00);
    }

    .alert-item.info .alert-icon {
      background: linear-gradient(135deg, #2196f3, #1976d2);
    }

    .alert-item.error .alert-icon {
      background: linear-gradient(135deg, #f44336, #d32f2f);
    }

    .alert-content {
      flex: 1;
    }

    .alert-message {
      font-size: 0.95rem;
      color: #ffffff;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .alert-timestamp {
      font-size: 0.8rem;
      color: #78909c;
    }

    .alert-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #000;
      flex-shrink: 0;
    }

    .alert-item.critical {
      border-left: 3px solid #f44336;
    }

    .alert-item.warning {
      border-left: 3px solid #ff9800;
    }

    .alert-item.info {
      border-left: 3px solid #2196f3;
    }

    .alert-item.error {
      border-left: 3px solid #f44336;
    }

    @media (max-width: 768px) {
      .alert-panel {
        padding: 20px;
        height: auto;
        min-height: 300px;
        margin: 0 -5px;
      }

      .panel-header h3 {
        font-size: 1.1rem;
      }

      .alert-item {
        padding: 12px;
        gap: 10px;
      }

      .alert-icon {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }

      .alert-message {
        font-size: 0.9rem;
      }

      .alert-status {
        font-size: 0.65rem;
        padding: 3px 8px;
      }
    }
  `]
})
export class AlertPanelComponent {
  readonly alerts = input.required<Alert[]>();

  getAlertColor(type: string): string {
    switch (type) {
      case 'critical':
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#64ffda';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  }
}