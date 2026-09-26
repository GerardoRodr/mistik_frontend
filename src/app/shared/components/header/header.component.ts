import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);

  // Iniciales del usuario para el avatar
  protected readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user?.name) {
      return 'U';
    }
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  });

  // Estilo de badge segun rol
  protected readonly roleBadgeClass = computed(() => {
    const role = this.authService.userRole();
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'SUPERVISOR':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'AGENT':
      case 'ASESOR':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  });

  // Ejecutar cierre de sesion
  logout(): void {
    if (confirm('Deseas cerrar la sesion actual?')) {
      this.authService.logout();
    }
  }
}
