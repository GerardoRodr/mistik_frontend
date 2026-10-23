import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingService } from '../../../../core/services/booking.service';
import { CreatePaymentDto, Currency, RegisterPaymentResponse } from '../../../../core/models/booking.models';

@Component({
  selector: 'app-payment-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form-modal.component.html'
})
export class PaymentFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);

  readonly bookingId = input.required<string>();
  readonly bookingCode = input<string>('');
  readonly balanceDue = input<number>(0);
  readonly currency = input<Currency>('USD');

  readonly closed = output<void>();
  readonly paymentRegistered = output<RegisterPaymentResponse>();

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Formulario reactivo con validacion estricta de enlace a Google Drive
  readonly paymentForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', [Validators.required]],
    paymentMethod: ['TRANSFERENCIA', [Validators.required]],
    operationNumber: ['', [Validators.required, Validators.minLength(4)]],
    bankName: ['BCP', [Validators.required]],
    driveReceiptUrl: [
      '',
      [
        Validators.required,
        Validators.pattern('^https:\\/\\/drive\\.google\\.com\\/.+')
      ]
    ]
  });

  ngOnInit(): void {
    // Inicializar moneda y monto sugerido segun saldo
    this.paymentForm.patchValue({
      currency: this.currency(),
      amount: this.balanceDue() > 0 ? this.balanceDue() : null
    });
  }

  // Enviar abono
  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formVal = this.paymentForm.value;
    const dto: CreatePaymentDto = {
      amount: Number(formVal.amount),
      currency: formVal.currency as Currency,
      paymentMethod: formVal.paymentMethod,
      operationNumber: formVal.operationNumber.trim(),
      bankName: formVal.bankName.trim(),
      driveReceiptUrl: formVal.driveReceiptUrl.trim()
    };

    this.bookingService.registerPayment(this.bookingId(), dto).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.paymentRegistered.emit(response);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message;
        if (Array.isArray(msg)) {
          this.errorMessage.set(msg.join('. '));
        } else if (typeof msg === 'string') {
          this.errorMessage.set(msg);
        } else {
          this.errorMessage.set('Error al registrar el comprobante de pago en el servidor central.');
        }
      }
    });
  }

  // Cerrar modal
  close(): void {
    this.closed.emit();
  }
}
