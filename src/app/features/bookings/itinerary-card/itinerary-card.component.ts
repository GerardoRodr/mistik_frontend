import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingService } from '../../../core/services/booking.service';
import {
  Booking,
  BookingStatus,
  TransitionBookingDto
} from '../../../core/models/booking.models';

@Component({
  selector: 'app-itinerary-card',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './itinerary-card.component.html'
})
export class ItineraryCardComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  // Entrada de datos obligatoria
  readonly booking = input.required<Booking>();

  // Emision cuando ocurre un cambio de estado en la reserva
  readonly statusChanged = output<Booking>();

  // Senales reactivas de interaccion y transiciones
  readonly isTransitioning = signal<boolean>(false);
  readonly allowedTransitions = signal<BookingStatus[]>([]);
  readonly showTransitionModal = signal<boolean>(false);
  readonly selectedTargetStatus = signal<BookingStatus | null>(null);
  readonly cancellationReason = signal<string>('');
  readonly ticketNumber = signal<string>('');
  readonly transitionError = signal<string | null>(null);
  readonly copiedPnr = signal<boolean>(false);

  // Codigo PNR normalizado computado
  readonly displayPnr = computed(() => {
    const b = this.booking();
    return b.pnr || (b as any).passengers?.[0]?.pnr || b.bookingCode || 'SIN-PNR';
  });

  ngOnInit(): void {
    // Si la reserva trae transiciones permitidas precargadas, asignarlas
    if (this.booking().allowedTransitions?.length) {
      this.allowedTransitions.set(this.booking().allowedTransitions!);
    }
  }

  // Copiar codigo PNR al portapapeles con feedback temporal
  copyPnr(event: MouseEvent): void {
    event.stopPropagation();
    const pnr = this.displayPnr();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pnr).then(() => {
        this.copiedPnr.set(true);
        setTimeout(() => this.copiedPnr.set(false), 2000);
      });
    }
  }

  // Abrir modal de transicion consultando estados destino validos
  openTransitionModal(target?: BookingStatus): void {
    this.transitionError.set(null);
    this.cancellationReason.set('');
    this.ticketNumber.set('');

    if (target) {
      this.selectedTargetStatus.set(target);
      this.showTransitionModal.set(true);
      return;
    }

    // Consultar transiciones permitidas en backend
    this.isTransitioning.set(true);
    this.bookingService.getAllowedTransitions(this.booking().id).subscribe({
      next: (res) => {
        this.allowedTransitions.set(res.allowedTransitions);
        this.isTransitioning.set(false);
        if (res.allowedTransitions.length > 0) {
          this.selectedTargetStatus.set(res.allowedTransitions[0]);
          this.showTransitionModal.set(true);
        }
      },
      error: () => {
        this.isTransitioning.set(false);
        this.transitionError.set('No se pudieron obtener las transiciones permitidas.');
      }
    });
  }

  // Cerrar modal de transicion
  closeTransitionModal(): void {
    this.showTransitionModal.set(false);
    this.selectedTargetStatus.set(null);
    this.transitionError.set(null);
  }

  // Ejecutar cambio de estado a traves de la maquina de estados de vuelos
  confirmTransition(): void {
    const target = this.selectedTargetStatus();
    if (!target) return;

    if (target === 'CANCELLED' && this.cancellationReason().trim().length < 5) {
      this.transitionError.set('El motivo de cancelacion debe tener al menos 5 caracteres.');
      return;
    }

    this.isTransitioning.set(true);
    this.transitionError.set(null);

    const dto: TransitionBookingDto = {
      targetStatus: target,
      pnr: this.displayPnr(),
      cancellationReason: target === 'CANCELLED' ? this.cancellationReason().trim() : undefined,
      ticketNumber: target === 'IN_PROCESS' && this.ticketNumber().trim() ? this.ticketNumber().trim() : undefined
    };

    this.bookingService.transitionBooking(this.booking().id, dto).subscribe({
      next: (res) => {
        this.isTransitioning.set(false);
        this.showTransitionModal.set(false);
        // Notificar al componente padre con la reserva actualizada
        this.statusChanged.emit({
          ...this.booking(),
          status: res.transition.newStatus,
          allowedTransitions: res.transition.allowedNextStates
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isTransitioning.set(false);
        const msg = err.error?.message;
        if (Array.isArray(msg)) {
          this.transitionError.set(msg.join('. '));
        } else if (typeof msg === 'string') {
          this.transitionError.set(msg);
        } else {
          this.transitionError.set('Error al ejecutar la transicion de estado en el flujo operativo.');
        }
      }
    });
  }

  // Clases semanticas para badge de estado segun Design System
  getStatusBadgeClass(status: BookingStatus): string {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'IN_PROCESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  // Etiqueta legible de estado
  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'PENDING':
        return 'PENDIENTE';
      case 'CONFIRMED':
        return 'CONFIRMADO';
      case 'IN_PROCESS':
        return 'EMITIDO / EN PROCESO';
      case 'COMPLETED':
        return 'COMPLETADO';
      case 'CANCELLED':
        return 'ANULADO';
      default:
        return status;
    }
  }
}
