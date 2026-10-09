import { Routes } from '@angular/router';

// Rutas modulares para el gestor de reservas aereas PNR
export const bookingsRoutes: Routes = [
  {
    path: '',
    title: 'Bandeja de Reservas PNR | Mistik Tours ERP',
    loadComponent: () =>
      import('./booking-list/booking-list.component').then(
        (m) => m.BookingListComponent
      )
  },
  {
    path: 'nueva',
    title: 'Nueva Reserva Aerea | Mistik Tours ERP',
    loadComponent: () =>
      import('./booking-create/booking-create.component').then(
        (m) => m.BookingCreateComponent
      )
  }
];
