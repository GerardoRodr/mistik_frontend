import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guardia para rutas publicas que redirige a dashboard si ya existe sesion activa
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated() || !authService.getToken()) {
    return true;
  }

  // Si ya esta autenticado, redirigir al panel principal
  return router.createUrlTree(['/dashboard']);
};
