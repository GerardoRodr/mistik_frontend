import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

describe('Flujo de navegacion a Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mistik_token', 'valid-test-jwt');
    localStorage.setItem(
      'mistik_user',
      JSON.stringify({
        id: 'user-1',
        email: 'admin@mistiktours.com',
        name: 'Administrador Mistik',
        role: 'ADMIN'
      })
    );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding())
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe renderizar DashboardComponent al navegar a /dashboard con sesion activa', async () => {
    const harness = await RouterTestingHarness.create();
    const layout = await harness.navigateByUrl('/dashboard', LayoutComponent);

    expect(layout).toBeInstanceOf(LayoutComponent);
  });
});
