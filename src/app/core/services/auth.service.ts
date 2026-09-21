import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, User, UserRole } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenKey = 'mistik_token';
  private readonly userKey = 'mistik_user';

  // Senal reactiva con el usuario autenticado
  readonly currentUser = signal<User | null>(this.getStoredUser());

  // Senal computada que indica si hay sesion activa
  readonly isAuthenticated = computed(() => !!this.currentUser());

  // Senal computada con el rol actual
  readonly userRole = computed(() => this.currentUser()?.role || null);

  // Enviar credenciales al backend para iniciar sesion
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        this.saveSession(res.accessToken, res.user);
      })
    );
  }

  // Cerrar sesion, limpiar almacenamiento y redirigir
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // Obtener token almacenado
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Consultar perfil actualizado del usuario desde el backend
  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/profile`).pipe(
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  // Comprobar si el usuario tiene alguno de los roles permitidos
  hasRole(allowedRoles: UserRole[]): boolean {
    const currentRole = this.userRole();
    if (!currentRole) {
      return false;
    }

    // Normalizar equivalencia entre AGENT y ASESOR
    return allowedRoles.some((role) => {
      if (role === currentRole) {
        return true;
      }
      if ((role === 'AGENT' || role === 'ASESOR') && (currentRole === 'AGENT' || currentRole === 'ASESOR')) {
        return true;
      }
      return false;
    });
  }

  // Guardar sesion en almacenamiento local y senal
  private saveSession(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  // Recuperar usuario persistido de forma segura
  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
