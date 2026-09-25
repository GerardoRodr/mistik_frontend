import { Routes } from '@angular/router';

// Rutas modulares del dominio CRM
export const crmRoutes: Routes = [
  {
    path: '',
    redirectTo: 'customers',
    pathMatch: 'full'
  },
  {
    path: 'customers',
    title: 'Directorio Maestro de Clientes | Mistik Tours ERP',
    loadComponent: () =>
      import('./customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent
      )
  }
];
