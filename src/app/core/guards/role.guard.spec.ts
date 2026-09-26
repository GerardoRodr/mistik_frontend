import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

describe('roleGuard', () => {
  let authServiceMock: {
    hasRole: (roles: UserRole[]) => boolean;
  };

  beforeEach(() => {
    authServiceMock = {
      hasRole: () => false
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
  });

  it('debe permitir acceso retornando true si el rol es suficiente', () => {
    authServiceMock.hasRole = (roles) => roles.includes('ADMIN');

    const routeSnapshot = {
      data: { roles: ['ADMIN', 'SUPERVISOR'] }
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(routeSnapshot, {} as any));

    expect(result).toBe(true);
  });

  it('debe retornar UrlTree hacia /unauthorized si el rol es insuficiente', () => {
    authServiceMock.hasRole = () => false;

    const routeSnapshot = {
      data: { roles: ['ADMIN'] }
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(routeSnapshot, {} as any));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/unauthorized');
  });
});
