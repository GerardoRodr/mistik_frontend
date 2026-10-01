import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerDetailComponent } from './customer-detail.component';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerDetail } from '../../../core/models/customer.models';

describe('CustomerDetailComponent', () => {
  let component: CustomerDetailComponent;
  let fixture: ComponentFixture<CustomerDetailComponent>;
  let customerService: CustomerService;

  const mockCustomerDetail: CustomerDetail = {
    id: 'uuid-1234',
    documentType: 'DNI',
    documentNumber: '74859612',
    firstName: 'Lucia',
    lastName: 'Mendez',
    email: 'lucia.mendez@gmail.com',
    phoneNumber: '+51987654321',
    address: 'Av. America Sur 1234',
    createdAt: '2026-09-26T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z',
    bookings: [],
    passengers: [],
    payments: [],
    serviceTasks: [],
    visaProcesses: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [
        CustomerService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'uuid-1234' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    customerService = TestBed.inject(CustomerService);
  });

  it('debe cargar el expediente 360 grados usando el ID de la ruta', () => {
    vi.spyOn(customerService, 'getCustomerById').mockReturnValue(of(mockCustomerDetail));

    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(customerService.getCustomerById).toHaveBeenCalledWith('uuid-1234');
    expect(component.customer()).toEqual(mockCustomerDetail);
    expect(component.isLoading()).toBe(false);
  });

  it('debe calcular las iniciales del titular correctamente', () => {
    vi.spyOn(customerService, 'getCustomerById').mockReturnValue(of(mockCustomerDetail));

    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.getInitials()).toBe('LM');
  });

  it('debe permitir la alternancia de pestañas interactivas', () => {
    vi.spyOn(customerService, 'getCustomerById').mockReturnValue(of(mockCustomerDetail));

    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeTab()).toBe('overview');

    component.setTab('bookings');
    expect(component.activeTab()).toBe('bookings');

    component.setTab('visas');
    expect(component.activeTab()).toBe('visas');
  });

  it('debe mostrar mensaje de error si el cliente no existe (404)', () => {
    vi.spyOn(customerService, 'getCustomerById').mockReturnValue(
      throwError(() => ({ status: 404 }))
    );

    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('no existe en la base de datos');
    expect(component.isLoading()).toBe(false);
  });
});
