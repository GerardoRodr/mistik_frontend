import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

// Configuracion de rutas principales de la SPA
export const routes: Routes = [
  // Ruta publica para autenticacion
  {
    path: 'login',
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
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'crm',
        loadComponent: () =>
          import('./features/crm/customer-list/customer-list.component').then(
            (m) => m.CustomerListComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR'] }
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./features/error/unauthorized.component').then(
            (m) => m.UnauthorizedComponent
          )
      }
    ]
  },

  // Ruta comodin para errores 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/error/not-found.component').then((m) => m.NotFoundComponent)
  }
];
