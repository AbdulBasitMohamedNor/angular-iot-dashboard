import { Routes } from '@angular/router';

export const automationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./automation-list.component').then(m => m.AutomationListComponent),
    title: 'Automation Rules'
  },
  {
    path: 'create',
    loadComponent: () => 
      import('./automation-editor.component').then(m => m.AutomationEditorComponent),
    title: 'Create Automation'
  },
  {
    path: ':id',
    loadComponent: () => 
      import('./automation-editor.component').then(m => m.AutomationEditorComponent),
    title: 'Edit Automation'
  }
];