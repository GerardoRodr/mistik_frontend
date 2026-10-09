import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BookingService } from './booking.service';
import { environment } from '../../../environments/environment';
import {
  CreateBookingDto,
  TransitionBookingDto
} from '../models/booking.models';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe construir parametros de busqueda y paginacion en getBookings', () => {
    service.getBookings({ page: 1, limit: 10, status: 'PENDING', search: 'LIM456' }).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/api/v1/bookings` &&
      r.params.get('page') === '1' &&
      r.params.get('limit') === '10' &&
      r.params.get('status') === 'PENDING' &&
      r.params.get('search') === 'LIM456'
    );

    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  });

  it('debe solicitar detalle de reserva por ID en getBookingById', () => {
    service.getBookingById('uuid-booking-1').subscribe((booking) => {
      expect(booking.id).toBe('uuid-booking-1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/bookings/uuid-booking-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'uuid-booking-1', bookingCode: 'RES-001' });
  });

  it('debe enviar peticion POST para crear nueva reserva en createBooking', () => {
    const payload: CreateBookingDto = {
      customerId: 'uuid-cust-1',
      serviceType: 'FLIGHT',
      totalAmount: 650,
      currency: 'USD',
      pnr: 'LIM456'
    };

    service.createBooking(payload).subscribe((res) => {
      expect(res.bookingCode).toBe('RES-001');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'b-1', bookingCode: 'RES-001', ...payload });
  });

  it('debe consultar transiciones validas en getAllowedTransitions', () => {
    service.getAllowedTransitions('uuid-booking-1').subscribe((res) => {
      expect(res.currentStatus).toBe('PENDING');
      expect(res.allowedTransitions).toContain('CONFIRMED');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/bookings/uuid-booking-1/transitions`);
    expect(req.request.method).toBe('GET');
    req.flush({
      bookingId: 'uuid-booking-1',
      currentStatus: 'PENDING',
      allowedTransitions: ['CONFIRMED', 'CANCELLED']
    });
  });

  it('debe ejecutar transicion de estado de vuelo en transitionBooking', () => {
    const payload: TransitionBookingDto = {
      targetStatus: 'CONFIRMED',
      pnr: 'LIM456'
    };

    service.transitionBooking('uuid-booking-1', payload).subscribe((res) => {
      expect(res.transition.success).toBe(true);
      expect(res.transition.newStatus).toBe('CONFIRMED');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/bookings/uuid-booking-1/transition`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      transition: {
        success: true,
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        allowedNextStates: ['IN_PROCESS', 'CANCELLED'],
        message: 'Transicion ejecutada exitosamente'
      },
      booking: { id: 'uuid-booking-1', status: 'CONFIRMED' }
    });
  });

  it('debe devolver el catalogo de consolidadoras mayoristas y aerolineas', () => {
    const wholesalers = service.getWholesalers();
    expect(wholesalers.length).toBeGreaterThanOrEqual(5);
    expect(wholesalers.some((w) => w.code === 'COSTAMAR')).toBe(true);
    expect(wholesalers.some((w) => w.code === 'LATAM')).toBe(true);
  });
});
