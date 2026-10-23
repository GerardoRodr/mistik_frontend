import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavGroup {
  name: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  host: {
    class: 'block h-full shrink-0'
  }
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly isCollapsed = signal(false);

  // Grupos y modulos del ERP de turismo con todos los modulos activos
  protected readonly navGroups: NavGroup[] = [
    {
      name: 'Operaciones',
      items: [
        {
          label: 'Panel Principal',
          path: '/dashboard',
          icon: 'dashboard'
        },
        {
          label: 'Directorio de Clientes',
          path: '/crm',
          icon: 'users'
        }
      ]
    },
    {
      name: 'Gestión Turística',
      items: [
        {
          label: 'Reservas & Vuelos',
          path: '/reservas',
          icon: 'plane'
        },
        {
          label: 'Trámites de Visas',
          path: '/visas',
          icon: 'passport'
        },
        {
          label: 'Flujo Operativo Kanban',
          path: '/kanban',
          icon: 'kanban'
        }
      ]
    },
    {
      name: 'Finanzas & Analítica',
      items: [
        {
          label: 'Analítica & Finanzas',
          path: '/analytics',
          icon: 'chart'
        }
      ]
    }
  ];

  // Alternar ancho del panel de navegacion
  toggleCollapse(): void {
    this.isCollapsed.update((val) => !val);
  }
}
