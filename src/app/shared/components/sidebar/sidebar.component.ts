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

  // Grupos y modulos del ERP de turismo
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
          label: 'Directorio Clientes',
          path: '/crm',
          icon: 'users'
        }
      ]
    },
    {
      name: 'Gestion Turistica',
      items: [
        {
          label: 'Reservas & Vuelos',
          path: '/reservas',
          icon: 'plane',
          badge: 'Proximo',
          disabled: true
        },
        {
          label: 'Tramites de Visas',
          path: '/visas',
          icon: 'passport',
          badge: 'Proximo',
          disabled: true
        },
        {
          label: 'Flujo Operativo Kanban',
          path: '/kanban',
          icon: 'kanban',
          badge: 'Proximo',
          disabled: true
        }
      ]
    },
    {
      name: 'Finanzas',
      items: [
        {
          label: 'Facturacion & Cobros',
          path: '/facturacion',
          icon: 'receipt',
          badge: 'Proximo',
          disabled: true
        }
      ]
    }
  ];

  // Alternar ancho del panel de navegacion
  toggleCollapse(): void {
    this.isCollapsed.update((val) => !val);
  }
}
