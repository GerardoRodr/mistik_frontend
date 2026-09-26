import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, PaginationMeta } from '../../../core/models/customer.models';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, CustomerFormComponent],
  templateUrl: './customer-list.component.html'
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  @ViewChild('searchInputRef') searchInputRef?: ElementRef<HTMLInputElement>;

  // Senales reactivas de estado para Data Grid ERP
  protected readonly customers = signal<Customer[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSearching = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly lastCreatedCustomer = signal<Customer | null>(null);

  // Metadatos de paginacion de alta densidad
  protected readonly meta = signal<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Senal de busqueda reactiva
  protected readonly searchInput = signal<string>('');
  private readonly searchSubject = new Subject<string>();

  // Atajo de teclado para enfocar busqueda con la tecla / o Ctrl+K
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (!isEditing && (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'))) {
      event.preventDefault();
      this.searchInputRef?.nativeElement.focus();
    }
  }

  ngOnInit(): void {
    // Busqueda reactiva con debounce de 350ms segun WBS 4.1.1.3
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged()
      )
      .subscribe((query) => {
        this.meta.update((m) => ({ ...m, page: 1 }));
        this.loadCustomers(query);
      });

    this.loadCustomers();
  }

  // Cargar datos desde el backend central
  loadCustomers(searchQuery?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const term = searchQuery !== undefined ? searchQuery : this.searchInput();
    if (term.trim().length > 0) {
      this.isSearching.set(true);
    }

    this.customerService
      .getCustomers({
        page: this.meta().page,
        limit: this.meta().limit,
        search: term
      })
      .subscribe({
        next: (res) => {
          this.customers.set(res.data);
          this.meta.set(res.meta);
          this.isLoading.set(false);
          this.isSearching.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.isSearching.set(false);
          if (err.status === 0) {
            this.errorMessage.set('Sin conexion con el servidor central de la agencia.');
          } else {
            this.errorMessage.set(err.error?.message || 'Error al recuperar registros de clientes.');
          }
        }
      });
  }

  // Capturar cambios en la caja de busqueda
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchInput.set(input.value);
    this.searchSubject.next(input.value);
  }

  // Limpiar filtro de busqueda
  clearSearch(): void {
    this.searchInput.set('');
    this.searchSubject.next('');
    this.searchInputRef?.nativeElement.focus();
  }

  // Navegar entre paginas
  goToPage(newPage: number): void {
    if (newPage < 1 || newPage > this.meta().totalPages || newPage === this.meta().page) {
      return;
    }
    this.meta.update((m) => ({ ...m, page: newPage }));
    this.loadCustomers();
  }

  // Modificar limite de registros por pagina
  onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const limit = parseInt(select.value, 10);
    this.meta.update((m) => ({ ...m, limit, page: 1 }));
    this.loadCustomers();
  }

  // Abrir modal de nuevo cliente con mascaras WBS 4.1.1.1
  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  // Cerrar modal de alta
  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  // Callback cuando se guarda exitosamente un nuevo cliente
  onCustomerCreated(customer: Customer): void {
    this.closeCreateModal();
    this.lastCreatedCustomer.set(customer);
    this.loadCustomers();

    // Auto-limpiar notificacion tras 6 segundos
    setTimeout(() => {
      this.lastCreatedCustomer.set(null);
    }, 6000);
  }

  // Navegar a la pantalla de Expediente 360 grados WBS 4.1.1.2
  viewCustomerDetail(id: string): void {
    this.router.navigate(['/crm/customers', id]);
  }
}
