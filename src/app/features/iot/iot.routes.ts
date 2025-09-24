import { Routes } from '@angular/router';

export const iotRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => 
      import('./components/iot-dashboard.component').then(m => m.IotDashboardComponent),
    title: 'Factory IoT Control Center'
  },
  {
    path: 'devices',
    loadChildren: () => 
      import('./devices/devices.routes').then(m => m.devicesRoutes),
    title: 'Device Management'
  },
  {
    path: 'analytics',
    loadComponent: () => 
      import('./analytics/analytics.component').then(m => m.AnalyticsComponent),
    title: 'Analytics'
  },
  {
    path: 'automations',
    loadChildren: () => 
      import('./automations/automations.routes').then(m => m.automationsRoutes),
    title: 'Automations'
  },
  {
    path: 'settings',
    loadComponent: () => 
      import('./settings/settings.component').then(m => m.SettingsComponent),
    title: 'IoT Settings'
  }
];