import {
  Component,
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
import { VisaProcess } from '../../../core/models/visa.models';

// Componente modal standalone para confirmar y registrar la conclusion consular
@Component({
  selector: 'app-visa-conclude-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visa-conclude-modal.component.html'
})
export class VisaConcludeModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly visaService = inject(VisaService);

  // Entradas y salidas del modal
  readonly visaProcess = input<VisaProcess | null>(null);
  readonly concluded = output<void>();
  readonly closed = output<void>();

  // Senales de estado reactivo
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Formulario reactivo para la resolucion consular
  readonly concludeForm: FormGroup = this.fb.group({
    resolution: ['APROBADA', [Validators.required]],
    notes: ['']
  });

  // Cerrar el modal
  close(): void {
    if (!this.isSubmitting()) {
      this.closed.emit();
    }
  }

  // Enviar actualizacion de conclusion al backend
  submitConclusion(): void {
    if (this.concludeForm.invalid) {
      this.concludeForm.markAllAsTouched();
      return;
    }

    const process = this.visaProcess();
    if (!process || !process.id) {
      this.errorMessage.set('No se ha especificado un expediente valido.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const values = this.concludeForm.value;
    const formattedNotes = `Resolucion: ${values.resolution}. ${values.notes || ''}`.trim();

    this.visaService
      .updateVisaProcessStatus(process.id, {
        targetStep: 'CONCLUIDO',
        notes: formattedNotes
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.concluded.emit();
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
              'Error al registrar la conclusion del tramite consular.'
            );
          }
        }
      });
  }
}
