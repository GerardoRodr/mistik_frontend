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
});
