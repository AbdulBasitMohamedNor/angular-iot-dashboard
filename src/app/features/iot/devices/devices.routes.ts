import { Routes } from '@angular/router';

export const devicesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./device-list.component').then(m => m.DeviceListComponent),
    title: 'Device List'
  },
  {
    path: ':id',
    loadComponent: () => 
      import('./device-details.component').then(m => m.DeviceDetailsComponent),
    title: 'Device Details'
  }
];