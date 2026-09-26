import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guardia de autenticacion para proteger rutas privadas
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.getToken()) {
    return true;
  }

  // Redirigir al login guardando la ruta intentada
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
