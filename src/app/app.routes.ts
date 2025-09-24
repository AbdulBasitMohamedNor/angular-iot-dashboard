import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/iot',
    pathMatch: 'full'
  },
  {
    path: 'iot',
    loadChildren: () => 
      import('./features/iot/iot.routes').then(m => m.iotRoutes)
  },
  {
    path: '**',
    redirectTo: '/iot'
  }
];
