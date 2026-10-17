import {
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { VisaService } from '../../../core/services/visa.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingPassenger } from '../../../core/models/booking.models';
import { CreateVisaProcessDto, VisaProcess } from '../../../core/models/visa.models';

@Component({
  selector: 'app-visa-ds160-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visa-ds160-form.component.html'
})
export class VisaDs160FormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly visaService = inject(VisaService);
  private readonly bookingService = inject(BookingService);

  // Emisores de eventos para integracion en modales o vistas
  readonly processCreated = output<VisaProcess>();
  readonly cancelled = output<void>();

  // Senales de estado reactivo
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly bookings = signal<Booking[]>([]);
  readonly selectedBooking = signal<Booking | null>(null);
  readonly availablePassengers = signal<BookingPassenger[]>([]);

  // Senal reactiva para el codigo DS-160 en tiempo real
  readonly currentCode = signal<string>('');

  // Validaciones reactivas computadas para retroalimentacion inmediata
  readonly codeLength = computed(() => this.currentCode().length);
  readonly isCodeLengthValid = computed(() => this.codeLength() === 10);
  readonly isCodePatternValid = computed(() => /^[A-Z0-9]{10}$/.test(this.currentCode()));
  readonly hasInvalidChars = computed(() => /[^A-Z0-9]/.test(this.currentCode()));

  // Formulario reactivo tipado
  readonly ds160Form: FormGroup = this.fb.group({
    bookingId: ['', [Validators.required]],
    passengerId: ['', [Validators.required]],
    confirmationCode: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern('^[A-Za-z0-9]{10}$')
      ]
    ],
    consularFeeAmount: [185.0, [Validators.required, Validators.min(185.0)]],
    currency: ['USD', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadAvailableBookings();

    // Sincronizar senal con el campo de codigo de confirmacion
    this.ds160Form.get('confirmationCode')?.valueChanges.subscribe((value: string) => {
      const upper = (value || '').toUpperCase();
      if (value !== upper) {
        this.ds160Form.get('confirmationCode')?.setValue(upper, { emitEvent: false });
      }
      this.currentCode.set(upper);
    });

    // Escuchar seleccion de reserva para listar sus pasajeros
    this.ds160Form.get('bookingId')?.valueChanges.subscribe((bookingId: string) => {
      this.onBookingSelected(bookingId);
    });
  }

  // Cargar reservas existentes para seleccionar titular
  loadAvailableBookings(): void {
    this.isLoading.set(true);
    this.bookingService.getBookings({ limit: 50 }).subscribe({
      next: (res) => {
        this.bookings.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // Manejar cambio de reserva y extraer pasajeros asociados
  private onBookingSelected(bookingId: string): void {
    const found = this.bookings().find((b) => b.id === bookingId) || null;
    this.selectedBooking.set(found);

    if (found && found.passengers && found.passengers.length > 0) {
      this.availablePassengers.set(found.passengers);
      if (found.passengers[0].id) {
        this.ds160Form.get('passengerId')?.setValue(found.passengers[0].id);
      }
    } else if (found && found.customer) {
      // Pasajero titular a partir del cliente de la reserva
      const titular: BookingPassenger = {
        id: found.customerId,
        documentType: found.customer.documentType || 'DNI',
        documentNumber: found.customer.documentNumber,
        firstName: found.customer.firstName,
        lastName: found.customer.lastName
      };
      this.availablePassengers.set([titular]);
      this.ds160Form.get('passengerId')?.setValue(titular.id);
    } else {
      this.availablePassengers.set([]);
      this.ds160Form.get('passengerId')?.setValue('');
    }
  }

  // Transformar input directo en mayusculas
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    this.ds160Form.get('confirmationCode')?.setValue(clean);
  }

  // Enviar formulario al backend
  submitForm(): void {
    if (this.ds160Form.invalid) {
      this.ds160Form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.ds160Form.value;
    const dto: CreateVisaProcessDto = {
      bookingId: formValues.bookingId,
      passengerId: formValues.passengerId,
      confirmationCode: formValues.confirmationCode,
      consularFeeAmount: formValues.consularFeeAmount,
      currency: formValues.currency
    };

    this.visaService.createVisaProcess(dto).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          `Tramite consular registrado exitosamente con codigo ${created.confirmationCode}.`
        );
        this.processCreated.emit(created);
        this.ds160Form.reset({
          consularFeeAmount: 185.0,
          currency: 'USD'
        });
        this.currentCode.set('');
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 409) {
          this.errorMessage.set(
            'El codigo DS-160 ingresado ya se encuentra registrado para otro proceso consular.'
          );
        } else if (err.error?.message) {
          this.errorMessage.set(
            Array.isArray(err.error.message)
              ? err.error.message.join(', ')
              : err.error.message
          );
        } else {
          this.errorMessage.set(
            'Ocurrio un error al intentar registrar el expediente consular en el servidor.'
          );
        }
      }
    });
  }

  // Cancelar y cerrar
  cancel(): void {
    this.cancelled.emit();
  }
}
