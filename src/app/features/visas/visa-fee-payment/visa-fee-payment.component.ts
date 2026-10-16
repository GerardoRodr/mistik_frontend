import {
  Component,
  OnInit,
  computed,
  inject,
  input,
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
import {
  ScheduleAppointmentDto,
  ScheduleAppointmentResponse,
  VisaProcess
} from '../../../core/models/visa.models';

@Component({
  selector: 'app-visa-fee-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visa-fee-payment.component.html'
})
export class VisaFeePaymentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly visaService = inject(VisaService);

  // Entradas y salidas del componente
  readonly visaProcess = input<VisaProcess | null>(null);
  readonly paymentRegistered = output<ScheduleAppointmentResponse>();
  readonly closed = output<void>();

  // Senales de estado reactivo
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Computado si el arancel ya fue verificado o pagado previamente
  readonly isFeeAlreadyPaid = computed(() => !!this.visaProcess()?.consularFeePaid);

  // Tipo de cambio referencial PEN/USD
  readonly exchangeRate = signal<number>(3.75);
  readonly feeUsd = signal<number>(185.0);
  readonly feePen = computed(() => (this.feeUsd() * this.exchangeRate()).toFixed(2));

  // Formulario reactivo de recaudacion de arancel MRV y cita consular
  readonly paymentForm: FormGroup = this.fb.group({
    mrvPaymentCode: [
      '',
      [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8,18}$/)]
    ],
    bankName: ['Scotiabank', [Validators.required]],
    paymentDate: [
      new Date().toISOString().substring(0, 10),
      [Validators.required]
    ],
    consularFeeAmount: [185.0, [Validators.required, Validators.min(185.0)]],
    currency: ['USD', [Validators.required]],
    appointmentDate: [this.getDefaultAppointmentDate(), [Validators.required]],
    location: ['Embajada de Estados Unidos en Lima', [Validators.required]],
    title: ['Entrevista Consular - Embajada', [Validators.required]],
    notes: ['']
  });

  // Fecha dinamica sugerida: 30 dias posteriores a la fecha actual a las 09:30 AM
  private getDefaultAppointmentDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(9, 30, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  ngOnInit(): void {
    const process = this.visaProcess();
    if (process) {
      if (process.confirmationCode) {
        this.paymentForm.patchValue({
          notes: `Cita consular para expediente ${process.confirmationCode}`
        });
      }
      if (process.consularFeePaid) {
        // Si el arancel ya fue cancelado, el comprobante es opcional para citas subsecuentes
        const mrvControl = this.paymentForm.get('mrvPaymentCode');
        mrvControl?.clearValidators();
        mrvControl?.setValidators([Validators.pattern(/^[A-Za-z0-9]{8,18}$/)]);
        mrvControl?.updateValueAndValidity();
      }
    }
  }

  // Transformar codigo MRV a mayusculas sin espacios
  onMrvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.toUpperCase().replace(/\s+/g, '');
    this.paymentForm.get('mrvPaymentCode')?.setValue(clean);
  }

  // Registrar pago y programar cita de forma atomica
  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const process = this.visaProcess();
    if (!process || !process.id) {
      this.errorMessage.set('No se ha especificado un expediente consular valido.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const values = this.paymentForm.value;
    const appointmentDateIso = new Date(values.appointmentDate).toISOString();

    const dto: ScheduleAppointmentDto = {
      appointmentDate: appointmentDateIso,
      location: values.location,
      title: values.title,
      ...(values.mrvPaymentCode ? { mrvPaymentCode: values.mrvPaymentCode } : {}),
      consularFeeAmount: Number(values.consularFeeAmount),
      notes: `${values.bankName} - Fecha Pago: ${values.paymentDate}. ${values.notes || ''}`.trim()
    };

    this.visaService.scheduleAppointment(process.id, dto).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          `Cita agendada exitosamente para el expediente ${process.confirmationCode || process.id.slice(0, 8)}.`
        );
        this.paymentRegistered.emit(response);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.error?.message) {
          this.errorMessage.set(
            Array.isArray(err.error.message)
              ? err.error.message.join(', ')
              : err.error.message
          );
        } else {
          this.errorMessage.set(
            'Error al registrar la cita consular en el servidor central.'
          );
        }
      }
    });
  }

  // Cerrar modal
  closeModal(): void {
    this.closed.emit();
  }
}
