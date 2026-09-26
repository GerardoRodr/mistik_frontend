import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

// Guardia de control de acceso basado en roles RBAC
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data?.['roles'] as UserRole[]) || [];

  // Si no se especificaron roles o el usuario cumple con alguno permitido
  if (allowedRoles.length === 0 || authService.hasRole(allowedRoles)) {
    return true;
  }

  // Redirigir a vista de acceso no autorizado
  router.navigate(['/unauthorized']);
  return false;
};
