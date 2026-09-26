import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly isCollapsed = signal(false);

  // Elementos de navegacion del sistema
  protected readonly navItems: NavItem[] = [
    {
      label: 'Panel Principal',
      path: '/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Clientes CRM',
      path: '/crm',
      icon: 'users',
      roles: ['ADMIN', 'SUPERVISOR', 'AGENT', 'ASESOR']
    },
    {
      label: 'Reservas Aereas',
      path: '/reservas',
      icon: 'ticket',
      badge: 'Hito 2',
      disabled: true
    },
    {
      label: 'Tramites Consulares',
      path: '/visas',
      icon: 'passport',
      badge: 'Hito 2',
      disabled: true
    },
    {
      label: 'Tablero Kanban',
      path: '/kanban',
      icon: 'kanban',
      badge: 'Hito 3',
      disabled: true
    }
  ];

  // Alternar colapso de la barra lateral en pantallas grandes
  toggleCollapse(): void {
    this.isCollapsed.update((val) => !val);
  }
}
