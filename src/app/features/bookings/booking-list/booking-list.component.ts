import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingService } from '../../../core/services/booking.service';
import {
  Booking,
  BookingStatus
} from '../../../core/models/booking.models';
import { ItineraryCardComponent } from '../itinerary-card/itinerary-card.component';
import { BookingCreateComponent } from '../booking-create/booking-create.component';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ItineraryCardComponent,
    BookingCreateComponent
  ],
  templateUrl: './booking-list.component.html'
})
export class BookingListComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  // Senales reactivas de datos y filtros
  readonly bookings = signal<Booking[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly searchTerm = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');
  readonly showCreateModal = signal<boolean>(false);

  // Reservas filtradas reactivamente mediante computed
  readonly filteredBookings = computed(() => {
    const list = this.bookings();
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();

    return list.filter((b) => {
      // Filtro por estado
      const matchStatus = status === 'ALL' || b.status === status;

      // Filtro por termino de busqueda (PNR, codigo de reserva, cliente o notas)
      const pnr = (b.pnr || (b as any).passengers?.[0]?.pnr || '').toLowerCase();
      const code = (b.bookingCode || b.code || '').toLowerCase();
      const customerName = b.customer
        ? `${b.customer.firstName} ${b.customer.lastName}`.toLowerCase()
        : '';
      const notes = (b.notes || '').toLowerCase();

      const matchTerm =
        !term ||
        pnr.includes(term) ||
        code.includes(term) ||
        customerName.includes(term) ||
        notes.includes(term);

      return matchStatus && matchTerm;
    });
  });

  // Metricas KPI reactivas
  readonly totalCount = computed(() => this.bookings().length);
  readonly pendingCount = computed(() => this.bookings().filter((b) => b.status === 'PENDING').length);
  readonly confirmedCount = computed(() => this.bookings().filter((b) => b.status === 'CONFIRMED').length);
  readonly inProcessCount = computed(() => this.bookings().filter((b) => b.status === 'IN_PROCESS').length);
  readonly cancelledCount = computed(() => this.bookings().filter((b) => b.status === 'CANCELLED').length);

  ngOnInit(): void {
    this.loadBookings();
  }

  // Cargar reservas desde el backend
  loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookingService.getBookings({ limit: 50 }).subscribe({
      next: (res) => {
        this.bookings.set(res.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 0) {
          this.errorMessage.set('Sin conexion con el servidor central de reservas.');
        } else {
          this.errorMessage.set('Error al recuperar las reservas del sistema.');
        }
      }
    });
  }

  // Filtrar por estado
  setStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  // Abrir modal de creacion de reserva
  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  // Cerrar modal de creacion
  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  // Callback cuando se registra una nueva reserva
  onBookingSaved(newBooking: Booking): void {
    this.bookings.update((prev) => [newBooking, ...prev]);
    this.closeCreateModal();
    const codeDisplay = newBooking.bookingCode && newBooking.pnr
      ? `${newBooking.bookingCode} (${newBooking.pnr})`
      : (newBooking.bookingCode || newBooking.pnr || 'PNR');
    this.showSuccessNotification(
      `Reserva ${codeDisplay} registrada exitosamente.`
    );
  }

  // Callback cuando una tarjeta de itinerario cambia de estado
  onBookingStatusChanged(updated: Booking): void {
    this.bookings.update((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
    const codeDisplay = updated.bookingCode && updated.pnr
      ? `${updated.bookingCode} (${updated.pnr})`
      : (updated.bookingCode || updated.pnr || 'PNR');
    this.showSuccessNotification(
      `Estado de la reserva ${codeDisplay} actualizado a ${updated.status}.`
    );
  }

  // Notificacion temporal de confirmacion
  private showSuccessNotification(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4000);
  }
}
