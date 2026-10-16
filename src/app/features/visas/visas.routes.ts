import { Routes } from '@angular/router';

export const visasRoutes: Routes = [
  {
    path: '',
    title: 'Tramites Consulares y Visas DS-160 | Mistik Tours ERP',
    loadComponent: () =>
      import('./visa-list/visa-list.component').then((m) => m.VisaListComponent)
  },
  {
    path: 'calendario',
    title: 'Calendario de Citas Consulares Multianuales | Mistik Tours ERP',
    loadComponent: () =>
      import('./visa-calendar-view/visa-calendar-view.component').then(
        (m) => m.VisaCalendarViewComponent
      )
  },
  {
    path: 'nuevo',
    title: 'Nuevo Tramite Consular DS-160 | Mistik Tours ERP',
    loadComponent: () =>
      import('./visa-ds160-form/visa-ds160-form.component').then(
        (m) => m.VisaDs160FormComponent
      )
  }
];
