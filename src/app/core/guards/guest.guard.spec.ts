import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
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

  it('debe permitir acceso al login retornando true si no hay sesion activa', () => {
    authServiceMock.isAuthenticated = () => false;
    authServiceMock.getToken = () => null;

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('debe retornar UrlTree hacia /dashboard si el operador ya tiene sesion activa', () => {
    authServiceMock.isAuthenticated = () => true;
    authServiceMock.getToken = () => 'valid-token';

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
