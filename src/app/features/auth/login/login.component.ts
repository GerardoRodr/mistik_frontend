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

  // Senales reactivas para el estado de la vista
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  // Formulario reactivo de credenciales
  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Alternar visibilidad de la contrasena
  toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  // Rellenar credenciales de prueba preconfiguradas
  fillSeedCredentials(role: 'ADMIN' | 'SUPERVISOR' | 'AGENT'): void {
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

  // Enviar formulario y procesar autenticacion
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
          this.errorMessage.set('Credenciales invalidas. Verifique su correo y contrasena.');
        } else if (err.error?.message) {
          const msg = Array.isArray(err.error.message)
            ? err.error.message.join(', ')
            : err.error.message;
          this.errorMessage.set(msg);
        } else {
          this.errorMessage.set('No se pudo conectar con el servidor backend. Verifique que este activo en el puerto 3000.');
        }
      }
    });
  }
}
