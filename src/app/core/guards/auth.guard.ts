import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guardia funcional que valida sesion activa o retorna UrlTree hacia /login
export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.getToken()) {
    return true;
  }

  // Retornar UrlTree atimico en lugar de navegacion manual
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
