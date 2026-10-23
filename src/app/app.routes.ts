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
        path: 'reservas',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR'] },
        loadChildren: () =>
          import('./features/bookings/bookings.routes').then((m) => m.bookingsRoutes)
      },
      {
        path: 'visas',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR'] },
        loadChildren: () =>
          import('./features/visas/visas.routes').then((m) => m.visasRoutes)
      },
      {
        path: 'kanban',
        title: 'Flujo Operativo Kanban | Mistik Tours ERP',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR'] },
        loadComponent: () =>
          import('./features/kanban/components/kanban-board/kanban-board.component').then(
            (m) => m.KanbanBoardComponent
          )
      },
      {
        path: 'analytics',
        title: 'Panel de Analítica y Finanzas | Mistik Tours ERP',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR'] },
        loadComponent: () =>
          import('./features/analytics/components/analytics-dashboard/analytics-dashboard.component').then(
            (m) => m.AnalyticsDashboardComponent
          )
      },
      {
        path: 'facturacion',
        redirectTo: 'analytics',
        pathMatch: 'full'
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
