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
  },
  {
    path: 'customers/:id',
    title: 'Expediente 360 del Pasajero | Mistik Tours ERP',
    loadComponent: () =>
      import('./customer-detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent
      )
  }
];
