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
import { VisaAppointment } from '../../../core/models/visa.models';

export interface MonthAppointmentGroup {
  monthKey: string;
  year: number;
  monthName: string;
  appointments: VisaAppointment[];
}

@Component({
  selector: 'app-visa-calendar-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './visa-calendar-view.component.html'
})
export class VisaCalendarViewComponent implements OnInit {
  private readonly visaService = inject(VisaService);

  // Anio de referencia dinamico
  readonly currentYear = new Date().getFullYear();

  // Senales reactivas de estado
  readonly appointments = signal<VisaAppointment[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Filtros reactivos con Signals
  readonly selectedYear = signal<number | 'ALL'>('ALL');
  readonly selectedMonth = signal<string>('ALL');
  readonly selectedLocation = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  // Nombres de meses en espanol para rotulado
  private readonly monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Setiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  // Meses para filtro rapido
  readonly months = [
    { value: 'ALL', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  // Anios disponibles calculados dinamicamente
  readonly availableYears = computed<number[]>(() => {
    const defaultRange = [this.currentYear, this.currentYear + 1, this.currentYear + 2];
    const appointmentYears = this.appointments().map((a) =>
      new Date(a.appointmentDate).getFullYear()
    );
    const set = new Set([...defaultRange, ...appointmentYears]);
    return Array.from(set).sort((a, b) => a - b);
  });

  // Citas filtradas reactivamente mediante computed
  readonly filteredAppointments = computed(() => {
    const list = this.appointments();
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const loc = this.selectedLocation();
    const query = this.searchQuery().trim().toLowerCase();

    return list
      .filter((appt) => {
        const apptDate = new Date(appt.appointmentDate);
        const apptYear = apptDate.getFullYear();
        const apptMonth = String(apptDate.getMonth() + 1).padStart(2, '0');

        // Filtro por anio
        if (year !== 'ALL' && apptYear !== year) {
          return false;
        }

        // Filtro por mes
        if (month !== 'ALL' && apptMonth !== month) {
          return false;
        }

        // Filtro por sede
        if (loc !== 'ALL') {
          if (loc === 'EMBAJADA' && !appt.location.toLowerCase().includes('embajada')) {
            return false;
          }
          if (loc === 'CAS' && !appt.location.toLowerCase().includes('cas')) {
            return false;
          }
        }

        // Filtro por texto (cliente, documento, codigo DS-160 o codigo de reserva)
        if (query) {
          const clientName = `${appt.visaProcess?.booking?.customer?.firstName || ''} ${appt.visaProcess?.booking?.customer?.lastName || ''}`.toLowerCase();
          const doc = (appt.visaProcess?.booking?.customer?.documentNumber || '').toLowerCase();
          const ds160 = (appt.visaProcess?.confirmationCode || '').toLowerCase();
          const bookingCode = (appt.visaProcess?.booking?.bookingCode || '').toLowerCase();
          const title = (appt.title || '').toLowerCase();

          return (
            clientName.includes(query) ||
            doc.includes(query) ||
            ds160.includes(query) ||
            bookingCode.includes(query) ||
            title.includes(query)
          );
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
  });

  // Citas agrupadas cronologicamente por Mes y Anio
  readonly groupedAppointments = computed<MonthAppointmentGroup[]>(() => {
    const filtered = this.filteredAppointments();
    const map = new Map<string, { year: number; monthName: string; appts: VisaAppointment[] }>();

    for (const appt of filtered) {
      const d = new Date(appt.appointmentDate);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, {
          year,
          monthName: `${this.monthNames[monthIdx]} ${year}`,
          appts: []
        });
      }
      map.get(key)!.appts.push(appt);
    }

    return Array.from(map.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([monthKey, val]) => ({
        monthKey,
        year: val.year,
        monthName: val.monthName,
        appointments: val.appts
      }));
  });

  // Metricas KPI reactivas y atemporales
  readonly totalCount = computed(() => this.appointments().length);
  readonly currentYearCount = computed(
    () =>
      this.appointments().filter(
        (a) => new Date(a.appointmentDate).getFullYear() === this.currentYear
      ).length
  );
  readonly futureYearsCount = computed(
    () =>
      this.appointments().filter(
        (a) => new Date(a.appointmentDate).getFullYear() > this.currentYear
      ).length
  );
  readonly scheduledCount = computed(
    () => this.appointments().filter((a) => a.status === 'SCHEDULED').length
  );
  readonly upcomingSoonCount = computed(
    () =>
      this.appointments().filter((a) => {
        const days = this.getDaysRemaining(a.appointmentDate);
        return days >= 0 && days <= 60;
      }).length
  );

  ngOnInit(): void {
    this.loadMultiannualAppointments();
  }

  // Cargar citas multianuales desde el backend
  loadMultiannualAppointments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const yearVal = this.selectedYear();
    const yearFilter = typeof yearVal === 'number' ? yearVal : undefined;

    this.visaService
      .getMultiannualAppointments({
        year: yearFilter,
        limit: 100
      })
      .subscribe({
        next: (res) => {
          this.appointments.set(res.data);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 0) {
            this.errorMessage.set(
              'Sin conexion con el servidor central de citas consulares.'
            );
          } else {
            this.errorMessage.set(
              'Error al cargar el repositorio de citas consulares multianuales.'
            );
          }
        }
      });
  }

  // Cambiar anio de visualizacion
  setYear(year: number | 'ALL'): void {
    this.selectedYear.set(year);
  }

  // Calcular dias restantes hasta la cita consular
  getDaysRemaining(isoDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(isoDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determinar badge de fase consular
  getPhaseBadge(appt: VisaAppointment): { label: string; class: string } {
    if (appt.visaProcess?.consularFeePaid && appt.status === 'SCHEDULED') {
      return {
        label: 'CITA_PROGRAMADA',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (appt.visaProcess?.consularFeePaid) {
      return {
        label: 'PAGO_ARANCEL',
        class: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    return {
      label: 'REGISTRADO',
      class: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }

  // Distinguir entre entrevista consular en Embajada y cita CAS
  isEmbassy(appt: VisaAppointment): boolean {
    return (
      appt.location.toLowerCase().includes('embajada') ||
      appt.title.toLowerCase().includes('embajada')
    );
  }
}
