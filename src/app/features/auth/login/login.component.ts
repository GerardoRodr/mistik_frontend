import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Senales reactivas de estado
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly showDevDrawer = signal(false);

  // Formulario reactivo de inicio de sesion
  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Alternar visibilidad de la contrasena
  toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  // Alternar panel desplegable de acceso rapido de desarrollo
  toggleDevDrawer(): void {
    this.showDevDrawer.update((val) => !val);
  }

  // Rellenar credenciales de depuracion
  fillDevCredentials(role: 'ADMIN' | 'SUPERVISOR' | 'AGENT'): void {
    const creds = {
      ADMIN: { email: 'admin@mistiktours.com', pass: 'Admin2026!' },
      SUPERVISOR: { email: 'supervisor@mistiktours.com', pass: 'Supervisor2026!' },
      AGENT: { email: 'agente@mistiktours.com', pass: 'Agente2026!' }
    }[role];

    this.loginForm.patchValue({
      email: creds.email,
      password: creds.pass
    });
    this.errorMessage.set(null);
  }

  // Enviar credenciales al backend de NestJS
  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Credenciales invalidas. Verifique correo institucional y contrasena.');
        } else if (err.error?.message) {
          const msg = Array.isArray(err.error.message)
            ? err.error.message.join(', ')
            : err.error.message;
          this.errorMessage.set(msg);
        } else {
          this.errorMessage.set('No se pudo establecer conexion con el servidor. Verifique su conexion.');
        }
      }
    });
  }
}
