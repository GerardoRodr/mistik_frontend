import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

describe('roleGuard', () => {
  let authServiceMock: {
    hasRole: (roles: UserRole[]) => boolean;
  };
  let routerMock: {
    navigate: (commands: any[]) => Promise<boolean>;
  };

  beforeEach(() => {
    authServiceMock = {
      hasRole: () => false
    };

    routerMock = {
      navigate: async () => true
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('debe permitir acceso si el usuario cuenta con el rol requerido', () => {
    authServiceMock.hasRole = (roles) => roles.includes('ADMIN');

    const routeSnapshot = {
      data: { roles: ['ADMIN', 'SUPERVISOR'] }
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(routeSnapshot, {} as any));

    expect(result).toBe(true);
  });

  it('debe bloquear y redirigir a unauthorized si el rol es insuficiente', () => {
    authServiceMock.hasRole = () => false;

    let navigatedTo: any = null;
    routerMock.navigate = async (commands) => {
      navigatedTo = commands;
      return true;
    };

    const routeSnapshot = {
      data: { roles: ['ADMIN'] }
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(routeSnapshot, {} as any));

    expect(result).toBe(false);
    expect(navigatedTo).toEqual(['/unauthorized']);
  });
});
