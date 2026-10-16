import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VisaService } from './visa.service';
import { environment } from '../../../environments/environment';
import {
  CreateVisaProcessDto,
  ScheduleAppointmentDto,
  TransitionVisaDto
} from '../models/visa.models';

describe('VisaService', () => {
  let service: VisaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VisaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(VisaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe construir parametros de busqueda y paginacion en getVisaProcesses', () => {
    service
      .getVisaProcesses({
        page: 1,
        limit: 10,
        currentStep: 'REGISTRO_DS160',
        search: 'AA00998877'
      })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/api/v1/visa-processes` &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '10' &&
        r.params.get('currentStep') === 'REGISTRO_DS160' &&
        r.params.get('search') === 'AA00998877'
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 }
    });
  });

  it('debe obtener detalle de tramite consular por ID en getVisaProcessById', () => {
    service.getVisaProcessById('uuid-visa-123').subscribe((res) => {
      expect(res.id).toBe('uuid-visa-123');
      expect(res.confirmationCode).toBe('AA00123456');
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/v1/visa-processes/uuid-visa-123`
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'uuid-visa-123',
      confirmationCode: 'AA00123456',
      currentStep: 'REGISTRO_DS160',
      consularFeePaid: false
    });
  });

  it('debe enviar peticion POST para crear nuevo tramite consular en createVisaProcess', () => {
    const payload: CreateVisaProcessDto = {
      bookingId: 'uuid-book-1',
      passengerId: 'uuid-pass-1',
      confirmationCode: 'AA00998877'
    };

    service.createVisaProcess(payload).subscribe((res) => {
      expect(res.id).toBe('uuid-new');
      expect(res.confirmationCode).toBe('AA00998877');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/visa-processes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.consularFeeAmount).toBe(185.0);
    expect(req.request.body.currency).toBe('USD');
    req.flush({
      id: 'uuid-new',
      bookingId: 'uuid-book-1',
      passengerId: 'uuid-pass-1',
      confirmationCode: 'AA00998877',
      consularFeeAmount: 185.0,
      currentStep: 'REGISTRO_DS160'
    });
  });

  it('debe enviar peticion PATCH para transicion de estado en updateVisaProcessStatus', () => {
    const transitionDto: TransitionVisaDto = {
      targetStep: 'PAGO_ARANCEL',
      confirmationCode: 'AA00998877'
    };

    service
      .updateVisaProcessStatus('uuid-visa-123', transitionDto)
      .subscribe((res) => {
        expect(res.transition.success).toBe(true);
        expect(res.transition.newStep).toBe('PAGO_ARANCEL');
      });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/v1/visa-processes/uuid-visa-123/status`
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.targetStep).toBe('PAGO_ARANCEL');
    req.flush({
      transition: {
        success: true,
        previousStep: 'REGISTRO_DS160',
        newStep: 'PAGO_ARANCEL',
        allowedNextSteps: ['CITA_CONSOLIDADA'],
        message: 'Fase consular actualizada'
      },
      visaProcess: {
        id: 'uuid-visa-123',
        currentStep: 'PAGO_ARANCEL'
      }
    });
  });

  it('debe programar cita y registrar arancel MRV $185 USD en scheduleAppointment', () => {
    const scheduleDto: ScheduleAppointmentDto = {
      appointmentDate: '2027-04-18T10:00:00.000Z',
      location: 'Embajada de Estados Unidos en Lima',
      title: 'Entrevista Consular - Embajada',
      mrvPaymentCode: 'MRV2027998877'
    };

    service.scheduleAppointment('uuid-visa-123', scheduleDto).subscribe((res) => {
      expect(res.message).toBe('Cita programada');
      expect(res.appointment.id).toBe('uuid-appt-1');
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/v1/visa-processes/uuid-visa-123/appointments`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body.consularFeeAmount).toBe(185.0);
    req.flush({
      message: 'Cita programada',
      appointment: {
        id: 'uuid-appt-1',
        title: 'Entrevista Consular - Embajada',
        appointmentDate: '2027-04-18T10:00:00.000Z',
        location: 'Embajada de Estados Unidos en Lima',
        status: 'SCHEDULED'
      },
      visaProcess: {
        id: 'uuid-visa-123',
        currentStep: 'CITA_CONSOLIDADA',
        consularFeePaid: true
      }
    });
  });

  it('debe consultar citas multianuales con filtros de anio y texto en getMultiannualAppointments', () => {
    service
      .getMultiannualAppointments({
        year: 2027,
        customerSearch: 'Perez',
        limit: 20
      })
      .subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.meta.range.year).toBe(2027);
      });

    const req = httpMock.expectOne(
      (r) =>
        r.url ===
          `${environment.apiUrl}/api/v1/visa-processes/appointments/multiannual` &&
        r.params.get('year') === '2027' &&
        r.params.get('customerSearch') === 'Perez' &&
        r.params.get('limit') === '20'
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        {
          id: 'uuid-appt-1',
          title: 'Entrevista Consular',
          appointmentDate: '2027-04-18T10:00:00.000Z',
          location: 'Embajada de Estados Unidos en Lima',
          status: 'SCHEDULED'
        }
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        range: { year: 2027, startDate: '2027-01-01', endDate: '2027-12-31' }
      }
    });
  });
});
