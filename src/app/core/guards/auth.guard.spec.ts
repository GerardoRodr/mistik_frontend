import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: {
    isAuthenticated: () => boolean;
    getToken: () => string | null;
  };
  let routerMock: {
    navigate: (commands: any[], extras?: any) => Promise<boolean>;
  };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: () => false,
      getToken: () => null
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

  it('debe permitir navegacion si el usuario esta autenticado', () => {
    authServiceMock.isAuthenticated = () => true;
    authServiceMock.getToken = () => 'valid-jwt';

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('debe bloquear navegacion y redirigir a login si no esta autenticado', () => {
    authServiceMock.isAuthenticated = () => false;
    authServiceMock.getToken = () => null;

    let navigatedTo: any = null;
    let navExtras: any = null;
    routerMock.navigate = async (commands, extras) => {
      navigatedTo = commands;
      navExtras = extras;
      return true;
    };

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/crm' } as RouterStateSnapshot)
    );

    expect(result).toBe(false);
    expect(navigatedTo).toEqual(['/login']);
    expect(navExtras?.queryParams?.returnUrl).toBe('/crm');
  });
});
