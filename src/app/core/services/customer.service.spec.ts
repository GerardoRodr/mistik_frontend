import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomerService } from './customer.service';
import { environment } from '../../../environments/environment';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomerService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe construir parametros de busqueda y paginacion en getCustomers', () => {
    service.getCustomers({ page: 2, limit: 10, search: 'Lucia' }).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/api/v1/customers` &&
      r.params.get('page') === '2' &&
      r.params.get('limit') === '10' &&
      r.params.get('search') === 'Lucia'
    );

    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0 } });
  });

  it('debe enviar peticion POST para registrar nuevo cliente', () => {
    const newCustomer = {
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez',
      email: 'lucia.mendez@gmail.com'
    };

    service.createCustomer(newCustomer).subscribe((created) => {
      expect(created.documentNumber).toBe('74859612');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customers`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCustomer);
    req.flush({ id: 'uuid-1', ...newCustomer, createdAt: '', updatedAt: '' });
  });

  it('debe normalizar bookingCode y aplanar colecciones relacionales en getCustomerById', () => {
    const rawBackendCustomer = {
      id: 'uuid-1',
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez',
      createdAt: '',
      updatedAt: '',
      bookings: [
        {
          id: 'b-1',
          bookingCode: 'RES-1001',
          serviceType: 'FLIGHT',
          status: 'CONFIRMED',
          totalAmount: 500,
          currency: 'USD',
          passengers: [{ id: 'p-1', firstName: 'Juan', lastName: 'Perez', documentType: 'DNI', documentNumber: '11223344' }],
          payments: [{ id: 'pay-1', amount: 500, currency: 'USD', paymentMethod: 'TRANSFER', operationNumber: 'OP-999', status: 'PAID', paidAt: '2026-09-26' }],
          visaProcesses: [{ id: 'v-1', currentStep: 'FORM_FILLING', country: 'EE.UU.' }],
          tasks: [{ id: 't-1', title: 'Emitir ticket', status: 'PENDING', priority: 'HIGH' }]
        }
      ]
    };

    service.getCustomerById('uuid-1').subscribe((detail) => {
      expect(detail.bookings?.[0].bookingCode).toBe('RES-1001');
      expect(detail.bookings?.[0].code).toBe('RES-1001');
      expect(detail.payments?.length).toBe(1);
      expect(detail.payments?.[0].transactionRef).toBe('OP-999');
      expect(detail.visaProcesses?.length).toBe(1);
      expect(detail.serviceTasks?.length).toBe(1);
      expect(detail.passengers?.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customers/uuid-1`);
    expect(req.request.method).toBe('GET');
    req.flush(rawBackendCustomer);
  });
});
