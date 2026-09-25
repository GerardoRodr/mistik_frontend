import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyLoginComponent }])
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe iniciar sin usuario autenticado', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.userRole()).toBeNull();
  });

  it('debe iniciar sesion y almacenar token y senal de usuario', () => {
    const mockResponse = {
      accessToken: 'jwt-token-123',
      user: {
        id: 'user-uuid-1',
        email: 'admin@mistiktours.com',
        name: 'Administrador Mistik',
        role: 'ADMIN' as const
      }
    };

    service.login({ email: 'admin@mistiktours.com', password: 'password' }).subscribe((res) => {
      expect(res.accessToken).toBe('jwt-token-123');
      expect(res.user.email).toBe('admin@mistiktours.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.currentUser()?.email).toBe('admin@mistiktours.com');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe('ADMIN');
    expect(service.getToken()).toBe('jwt-token-123');
  });

  it('debe validar roles correctamente considerando la equivalencia entre AGENT y ASESOR', () => {
    const mockUser = {
      id: 'agent-1',
      email: 'agente@mistiktours.com',
      name: 'Asesor Comercial',
      role: 'AGENT' as const
    };
    service.currentUser.set(mockUser);

    expect(service.hasRole(['ADMIN'])).toBe(false);
    expect(service.hasRole(['AGENT'])).toBe(true);
    expect(service.hasRole(['ASESOR'])).toBe(true);
  });

  it('debe limpiar sesion al cerrar sesion', () => {
    service.currentUser.set({
      id: 'agent-1',
      email: 'agente@mistiktours.com',
      name: 'Asesor Comercial',
      role: 'AGENT'
    });
    localStorage.setItem('mistik_token', 'test-token');

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });
});
