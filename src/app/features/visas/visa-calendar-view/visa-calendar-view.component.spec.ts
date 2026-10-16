import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisaCalendarViewComponent } from './visa-calendar-view.component';
import { VisaService } from '../../../core/services/visa.service';
import { VisaAppointment } from '../../../core/models/visa.models';

describe('VisaCalendarViewComponent', () => {
  let component: VisaCalendarViewComponent;
  let fixture: ComponentFixture<VisaCalendarViewComponent>;
  let visaService: VisaService;

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const mockAppointments: VisaAppointment[] = [
    {
      id: 'appt-1',
      title: 'Entrevista Consular - Embajada',
      appointmentDate: `${nextYear}-04-18T10:00:00.000Z`,
      location: 'Embajada de Estados Unidos en Lima',
      status: 'SCHEDULED',
      visaProcess: {
        id: 'proc-1',
        confirmationCode: 'AA00998877',
        consularFeePaid: true,
        currentStep: 'CITA_CONSOLIDADA',
        booking: {
          bookingCode: 'RES-2026-001',
          customer: {
            firstName: 'Carlos',
            lastName: 'Mendoza',
            documentNumber: '10203040'
          }
        }
      }
    },
    {
      id: 'appt-2',
      title: 'Cita CAS - Biometria y Fotos',
      appointmentDate: `${currentYear}-11-15T09:30:00.000Z`,
      location: 'Centro de Atencion de Solicitantes (CAS) Lima',
      status: 'SCHEDULED',
      visaProcess: {
        id: 'proc-2',
        confirmationCode: 'BB11223344',
        consularFeePaid: true,
        currentStep: 'CITA_CONSOLIDADA',
        booking: {
          bookingCode: 'RES-2026-002',
          customer: {
            firstName: 'Ana',
            lastName: 'Torres',
            documentNumber: '50607080'
          }
        }
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaCalendarViewComponent],
      providers: [
        VisaService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    visaService = TestBed.inject(VisaService);
  });

  beforeEach(() => {
    vi.spyOn(visaService, 'getMultiannualAppointments').mockReturnValue(
      of({
        data: mockAppointments,
        meta: {
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
          range: { year: currentYear, startDate: `${currentYear}-01-01`, endDate: `${nextYear}-12-31` }
        }
      })
    );

    fixture = TestBed.createComponent(VisaCalendarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar citas consulares multianuales al inicializarse', () => {
    expect(visaService.getMultiannualAppointments).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
    expect(component.appointments().length).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('debe calcular las metricas por anio actual y anios futuros reactivamente con Signals', () => {
    expect(component.currentYearCount()).toBe(1);
    expect(component.futureYearsCount()).toBe(1);
    expect(component.scheduledCount()).toBe(2);
  });

  it('debe agrupar citas cronologicamente por mes en groupedAppointments', () => {
    const groups = component.groupedAppointments();
    expect(groups.length).toBe(2);
    expect(groups[0].year).toBe(currentYear);
    expect(groups[1].year).toBe(nextYear);
  });

  it('debe filtrar citas consulares por termino de busqueda en tiempo real', () => {
    // Filtrar por nombre de cliente
    component.searchQuery.set('Carlos');
    fixture.detectChanges();

    const filtered = component.filteredAppointments();
    expect(filtered.length).toBe(1);
    expect(filtered[0].visaProcess?.booking?.customer?.firstName).toBe('Carlos');

    // Filtrar por codigo DS-160
    component.selectedYear.set('ALL');
    component.searchQuery.set('BB11223344');
    fixture.detectChanges();

    const filteredCode = component.filteredAppointments();
    expect(filteredCode.length).toBe(1);
    expect(filteredCode[0].visaProcess?.confirmationCode).toBe('BB11223344');
  });

  it('debe asignar el badge CITA_PROGRAMADA para citas agendadas con arancel pagado', () => {
    const badge = component.getPhaseBadge(mockAppointments[0]);
    expect(badge.label).toBe('CITA_PROGRAMADA');
    expect(badge.class).toContain('emerald');
  });

  it('debe identificar correctamente si una cita corresponde a la Embajada', () => {
    expect(component.isEmbassy(mockAppointments[0])).toBe(true);
    expect(component.isEmbassy(mockAppointments[1])).toBe(false);
  });
});
