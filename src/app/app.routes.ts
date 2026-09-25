import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

// Configuracion de rutas principales de la SPA con estandares Angular v22
export const routes: Routes = [
  // Ruta publica para autenticacion protegida por guestGuard
  {
    path: 'login',
    title: 'Acceso de Operadores | Mistik Tours ERP',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },

  // Rutas privadas protegidas bajo Layout principal
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        title: 'Panel de Control Operativo | Mistik Tours ERP',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'crm',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR'] },
        loadChildren: () =>
          import('./features/crm/crm.routes').then((m) => m.crmRoutes)
      },
      {
        path: 'unauthorized',
        title: 'Acceso Denegado | Mistik Tours ERP',
        loadComponent: () =>
          import('./features/error/unauthorized.component').then(
            (m) => m.UnauthorizedComponent
          )
      }
    ]
  },

  // Ruta comodin para recursos 404
  {
    path: '**',
    title: 'Recurso No Localizado | Mistik Tours ERP',
    loadComponent: () =>
      import('./features/error/not-found.component').then((m) => m.NotFoundComponent)
  }
];
