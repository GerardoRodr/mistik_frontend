import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: {
    isAuthenticated: () => boolean;
    getToken: () => string | null;
  };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: () => false,
      getToken: () => null
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
  });

  it('debe permitir navegacion retornando true si el usuario esta autenticado', () => {
    authServiceMock.isAuthenticated = () => true;
    authServiceMock.getToken = () => 'valid-jwt';

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('debe retornar UrlTree hacia /login conservando returnUrl si no esta autenticado', () => {
    authServiceMock.isAuthenticated = () => false;
    authServiceMock.getToken = () => null;

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/crm' } as RouterStateSnapshot)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Fcrm');
  });
});
