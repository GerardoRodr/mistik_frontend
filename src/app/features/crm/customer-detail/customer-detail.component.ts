import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerDetail } from '../../../core/models/customer.models';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

export type CustomerDetailTab =
  | 'overview'
  | 'bookings'
  | 'visas'
  | 'passengers'
  | 'payments'
  | 'tasks';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, CustomerFormComponent],
  templateUrl: './customer-detail.component.html'
})
export class CustomerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);

  // Senales reactivas del expediente 360 grados
  readonly customer = signal<CustomerDetail | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<CustomerDetailTab>('overview');
  readonly showEditModal = signal<boolean>(false);
  readonly updateSuccessMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomerDetail(id);
    } else {
      this.errorMessage.set('Identificador de cliente no especificado en la ruta.');
      this.isLoading.set(false);
    }
  }

  // Cargar ficha 360 grados del cliente desde el backend
  loadCustomerDetail(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.customerService.getCustomerById(id).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 404) {
          this.errorMessage.set('El expediente del cliente solicitado no existe en la base de datos.');
        } else if (err.status === 0) {
          this.errorMessage.set('Sin conexion con el servidor central de Mistik Tours.');
        } else {
          this.errorMessage.set(err.error?.message || 'Error al recuperar el expediente 360 grados.');
        }
      }
    });
  }

  // Cambiar pestaña activa
  setTab(tab: CustomerDetailTab): void {
    this.activeTab.set(tab);
  }

  // Abrir modal de edicion de datos
  openEditModal(): void {
    this.showEditModal.set(true);
  }

  // Cerrar modal de edicion
  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  // Callback cuando el cliente ha sido actualizado con exito
  onCustomerUpdated(updated: Customer): void {
    this.customer.update((prev) => (prev ? { ...prev, ...updated } : (updated as CustomerDetail)));
    this.closeEditModal();
    this.updateSuccessMessage.set('Ficha del cliente actualizada correctamente.');

    // Ocultar mensaje de exito tras 4 segundos
    setTimeout(() => {
      this.updateSuccessMessage.set(null);
    }, 4000);
  }

  // Helper para iniciales de avatar
  getInitials(): string {
    const c = this.customer();
    if (!c) return 'CL';
    const first = c.firstName ? c.firstName[0].toUpperCase() : '';
    const last = c.lastName ? c.lastName[0].toUpperCase() : '';
    return `${first}${last}` || 'CL';
  }

  // Volver a la lista del directorio
  goBack(): void {
    this.router.navigate(['/crm/customers']);
  }
}
