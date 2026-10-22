import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AlertsSocketService } from '../../../core/services/alerts-socket.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './header.component.html',
  host: {
    class: 'block shrink-0'
  }
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly alertsService = inject(AlertsSocketService);

  // Control del panel desplegable de notificaciones
  readonly showNotificationsPanel = signal<boolean>(false);

  // Iniciales del operador para el avatar
  protected readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user?.name) {
      return 'OP';
    }
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  });

  // Etiqueta formal del rol para visualizacion de ERP
  protected readonly roleDisplay = computed(() => {
    const role = this.authService.userRole();
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISOR':
        return 'Supervisor Operativo';
      case 'AGENT':
      case 'ASESOR':
        return 'Asesor Comercial';
      default:
        return 'Operador';
    }
  });

  // Estilo de insignia segun rol
  protected readonly roleBadgeClass = computed(() => {
    const role = this.authService.userRole();
    switch (role) {
      case 'ADMIN':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUPERVISOR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AGENT':
      case 'ASESOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  });

  // Alternar apertura del panel de notificaciones
  toggleNotifications(): void {
    this.showNotificationsPanel.update((val) => !val);
  }

  // Cerrar panel de notificaciones
  closeNotifications(): void {
    this.showNotificationsPanel.set(false);
  }

  // Marcar todas las notificaciones como leidas
  markAllAsRead(): void {
    this.alertsService.markAllAsRead();
  }

  // Cerrar sesion de la estacion
  logout(): void {
    if (confirm('¿Desea cerrar la sesión de la estación de trabajo actual?')) {
      this.authService.logout();
    }
  }
}
