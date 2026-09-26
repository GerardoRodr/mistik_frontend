import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, PaginationMeta } from '../../../core/models/customer.models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-list.component.html'
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly fb = inject(FormBuilder);

  // Senales reactivas de estado para Data Grid ERP
  protected readonly customers = signal<Customer[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly createError = signal<string | null>(null);
  protected readonly showCreateModal = signal(false);

  // Metadatos de paginacion de alta densidad
  protected readonly meta = signal<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Parametro de busqueda reactiva
  protected readonly searchInput = signal('');
  private readonly searchSubject = new Subject<string>();

  // Formulario reactivo para alta de clientes
  protected readonly createForm = this.fb.group({
    documentType: ['DNI', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(15)]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phoneNumber: ['', [Validators.pattern(/^[0-9+\s-]{7,15}$/)]],
    address: ['']
  });

  ngOnInit(): void {
    // Busqueda reactiva con debounce de 350ms
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

  // Cargar datos desde el backend
  loadCustomers(searchQuery?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const term = searchQuery !== undefined ? searchQuery : this.searchInput();

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
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
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

  // Abrir modal de nuevo cliente
  openCreateModal(): void {
    this.createForm.reset({ documentType: 'DNI' });
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  // Cerrar modal
  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createError.set(null);
  }

  // Enviar formulario al backend
  submitCreateCustomer(): void {
    if (this.createForm.invalid || this.isCreating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.createError.set(null);

    const val = this.createForm.getRawValue();

    this.customerService
      .createCustomer({
        documentType: val.documentType!,
        documentNumber: val.documentNumber!.trim(),
        firstName: val.firstName!.trim(),
        lastName: val.lastName!.trim(),
        email: val.email ? val.email.trim() : undefined,
        phoneNumber: val.phoneNumber ? val.phoneNumber.trim() : undefined,
        address: val.address ? val.address.trim() : undefined
      })
      .subscribe({
        next: () => {
          this.isCreating.set(false);
          this.closeCreateModal();
          this.loadCustomers();
        },
        error: (err: HttpErrorResponse) => {
          this.isCreating.set(false);
          if (err.status === 409) {
            this.createError.set(`Ya existe un cliente registrado con el documento ${val.documentType} ${val.documentNumber}.`);
          } else if (err.error?.message) {
            const msg = Array.isArray(err.error.message)
              ? err.error.message.join(', ')
              : err.error.message;
            this.createError.set(msg);
          } else {
            this.createError.set('No se pudo completar el registro del cliente.');
          }
        }
      });
  }
}
