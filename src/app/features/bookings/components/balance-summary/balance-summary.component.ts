import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { BookingBalance, RegisterPaymentResponse } from '../../../../core/models/booking.models';
import { PaymentFormModalComponent } from '../payment-form-modal/payment-form-modal.component';

@Component({
  selector: 'app-balance-summary',
  standalone: true,
  imports: [CommonModule, DatePipe, PaymentFormModalComponent],
  templateUrl: './balance-summary.component.html'
})
export class BalanceSummaryComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  readonly bookingId = input.required<string>();
  readonly bookingCode = input<string>('');
  readonly closed = output<void>();

  // Senales reactivas
  readonly balance = signal<BookingBalance | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showPaymentModal = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);

  // Porcentaje de recaudacion computado
  readonly paidPercentage = computed(() => {
    const b = this.balance();
    if (!b || !b.totalAmount || b.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((b.totalPaid / b.totalAmount) * 100));
  });

  ngOnInit(): void {
    this.loadBalance();
  }

  // Cargar saldo consolidado desde el backend
  loadBalance(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookingService.getBookingBalance(this.bookingId()).subscribe({
      next: (data) => {
        this.balance.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(
          'No se pudo recuperar el balance financiero de la reserva.'
        );
      }
    });
  }

  // Abrir modal de nuevo pago
  openPaymentModal(): void {
    this.showPaymentModal.set(true);
  }

  // Cerrar modal de pago
  closePaymentModal(): void {
    this.showPaymentModal.set(false);
  }

  // Callback cuando se registra un pago
  onPaymentRegistered(response: RegisterPaymentResponse): void {
    this.showPaymentModal.set(false);
    this.balance.set(response.balance);
    this.successMessage.set('Abono registrado y saldo recalculado exitosamente.');
    setTimeout(() => this.successMessage.set(null), 4000);
  }

  // Cerrar visor
  close(): void {
    this.closed.emit();
  }
}
