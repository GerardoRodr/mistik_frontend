import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { VisaService } from '../../../core/services/visa.service';
import { VisaProcess, VisaStep } from '../../../core/models/visa.models';
import { VisaDs160FormComponent } from '../visa-ds160-form/visa-ds160-form.component';
import { VisaFeePaymentComponent } from '../visa-fee-payment/visa-fee-payment.component';
import { PassportOcrModalComponent } from '../components/passport-ocr-modal/passport-ocr-modal.component';
import { OcrPassportResult } from '../../../core/services/ai.service';
import { VisaConcludeModalComponent } from '../visa-conclude-modal/visa-conclude-modal.component';

@Component({
  selector: 'app-visa-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    VisaDs160FormComponent,
    VisaFeePaymentComponent,
    PassportOcrModalComponent,
    VisaConcludeModalComponent
  ],
  templateUrl: './visa-list.component.html'
})
export class VisaListComponent implements OnInit {
  private readonly visaService = inject(VisaService);

  // Senales de estado reactivo
  readonly visaProcesses = signal<VisaProcess[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Modales
  readonly showDs160Modal = signal<boolean>(false);
  readonly showOcrModal = signal<boolean>(false);
  readonly selectedProcessForPayment = signal<VisaProcess | null>(null);
  readonly selectedProcessForConclude = signal<VisaProcess | null>(null);

  // Filtros reactivos con Signals
  readonly selectedStep = signal<string>('ALL');
  readonly searchTerm = signal<string>('');

  // Expedientes filtrados reactivamente mediante computed
  readonly filteredProcesses = computed(() => {
    const list = this.visaProcesses();
    const step = this.selectedStep();
    const term = this.searchTerm().trim().toLowerCase();

    return list.filter((p) => {
      // Filtro por fase
      const matchStep = step === 'ALL' || p.currentStep === step;

      // Filtro por termino (codigo DS-160, cliente, documento o reserva)
      const code = (p.confirmationCode || '').toLowerCase();
      const clientName = `${p.passenger?.firstName || p.booking?.customer?.firstName || ''} ${p.passenger?.lastName || p.booking?.customer?.lastName || ''}`.toLowerCase();
      const doc = (p.passenger?.documentNumber || p.booking?.customer?.documentNumber || '').toLowerCase();
      const bookingCode = (p.booking?.bookingCode || '').toLowerCase();

      const matchTerm =
        !term ||
        code.includes(term) ||
        clientName.includes(term) ||
        doc.includes(term) ||
        bookingCode.includes(term);

      return matchStep && matchTerm;
    });
  });

  // Metricas KPI computadas
  readonly totalCount = computed(() => this.visaProcesses().length);
  readonly ds160Count = computed(
    () => this.visaProcesses().filter((p) => p.currentStep === 'REGISTRO_DS160').length
  );
  readonly feePaidCount = computed(
    () => this.visaProcesses().filter((p) => p.consularFeePaid).length
  );
  readonly appointmentsCount = computed(
    () => this.visaProcesses().filter((p) => p.currentStep === 'CITA_CONSOLIDADA').length
  );
  readonly completedCount = computed(
    () => this.visaProcesses().filter((p) => p.currentStep === 'CONCLUIDO').length
  );

  ngOnInit(): void {
    this.loadVisaProcesses();
  }

  // Cargar expedientes consulares desde el backend
  loadVisaProcesses(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.visaService.getVisaProcesses({ limit: 100 }).subscribe({
      next: (res) => {
        this.visaProcesses.set(res.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 0) {
          this.errorMessage.set(
            'Sin comunicación con el microservicio de trámites consulares.'
          );
        } else {
          this.errorMessage.set(
            'Error al cargar el listado de expedientes consulares.'
          );
        }
      }
    });
  }

  // Filtrado por estado de la maquina de fases
  setStepFilter(step: string): void {
    this.selectedStep.set(step);
  }

  // Abrir modal de nuevo formulario DS-160
  openDs160Modal(): void {
    this.showDs160Modal.set(true);
  }

  // Cerrar modal DS-160
  closeDs160Modal(): void {
    this.showDs160Modal.set(false);
  }

  // Callback cuando se procesa e importa un pasaporte por OCR
  onPassportImported(result: OcrPassportResult): void {
    this.showOcrModal.set(false);
    this.successMessage.set(
      `Pasaporte ${result.passportNumber} de ${result.fullName} verificado con éxito (${result.monthsRemaining} meses de vigencia).`
    );
    this.openDs160Modal();
  }

  // Callback cuando se crea exitosamente un nuevo tramite DS-160
  onProcessCreated(newProcess: VisaProcess): void {
    this.visaProcesses.update((prev) => [newProcess, ...prev]);
    this.closeDs160Modal();
    this.successMessage.set(
      `Expediente consular ${newProcess.confirmationCode} registrado con éxito.`
    );
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  // Abrir modal de pago o cita para un expediente especifico
  openFeeModal(process: VisaProcess): void {
    this.selectedProcessForPayment.set(process);
  }

  // Cerrar modal de pago
  closeFeeModal(): void {
    this.selectedProcessForPayment.set(null);
  }

  // Callback cuando se registra exitosamente el arancel o cita
  onPaymentRegistered(): void {
    this.closeFeeModal();
    this.loadVisaProcesses();
    this.successMessage.set(
      'Pago de arancel MRV y/o cita consular registrados exitosamente.'
    );
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  // Abrir modal de conclusion para un expediente
  openConcludeModal(process: VisaProcess): void {
    this.selectedProcessForConclude.set(process);
  }

  // Cerrar modal de conclusion
  closeConcludeModal(): void {
    this.selectedProcessForConclude.set(null);
  }

  // Callback cuando se concluye exitosamente el tramite
  onProcessConcluded(): void {
    const process = this.selectedProcessForConclude();
    const code = process?.confirmationCode || '';
    this.closeConcludeModal();
    this.loadVisaProcesses();
    this.successMessage.set(
      `Expediente consular ${code} concluido exitosamente.`
    );
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  // Avanzar deterministamente a la siguiente fase consular
  advanceStep(process: VisaProcess, targetStep: VisaStep): void {
    this.visaService.updateVisaProcessStatus(process.id, { targetStep }).subscribe({
      next: (res) => {
        this.visaProcesses.update((list) =>
          list.map((p) => (p.id === process.id ? res.visaProcess : p))
        );
        this.successMessage.set(
          `Expediente ${process.confirmationCode} actualizado a: ${this.getStepBadge(targetStep).label}.`
        );
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Error al actualizar la fase del trámite consular.';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        setTimeout(() => this.errorMessage.set(null), 6000);
      }
    });
  }

  // Obtener estilos y etiquetas por fase
  getStepBadge(step: VisaStep): { label: string; class: string } {
    switch (step) {
      case 'REGISTRO_DS160':
        return {
          label: 'Registro DS-160',
          class: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'PAGO_ARANCEL':
        return {
          label: 'Pago Arancel MRV',
          class: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'CITA_CONSOLIDADA':
        return {
          label: 'Cita Consolidada',
          class: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
      case 'CONCLUIDO':
        return {
          label: 'Trámite Concluido',
          class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      default:
        return {
          label: step,
          class: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  }

  // Obtener indice de fase (1 a 4)
  getStepIndex(step: VisaStep): number {
    switch (step) {
      case 'REGISTRO_DS160':
        return 1;
      case 'PAGO_ARANCEL':
        return 2;
      case 'CITA_CONSOLIDADA':
        return 3;
      case 'CONCLUIDO':
        return 4;
      default:
        return 1;
    }
  }
}
