import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisaDs160FormComponent } from './visa-ds160-form.component';
import { VisaService } from '../../../core/services/visa.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.models';
import { VisaProcess } from '../../../core/models/visa.models';

describe('VisaDs160FormComponent', () => {
  let component: VisaDs160FormComponent;
  let fixture: ComponentFixture<VisaDs160FormComponent>;
  let visaService: VisaService;
  let bookingService: BookingService;

  const mockBooking: Booking = {
    id: 'book-uuid-1',
    bookingCode: 'RES-001',
    customerId: 'cust-uuid-1',
    serviceType: 'VISA',
    status: 'IN_PROCESS',
    totalAmount: 185.0,
    currency: 'USD',
    createdAt: '2026-10-16T00:00:00Z',
    updatedAt: '2026-10-16T00:00:00Z',
    customer: {
      id: 'cust-uuid-1',
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Juan',
      lastName: 'Perez'
    },
    passengers: [
      {
        id: 'pass-uuid-1',
        documentType: 'DNI',
        documentNumber: '74859612',
        firstName: 'Juan',
        lastName: 'Perez'
      }
    ]
  };

  const mockCreatedProcess: VisaProcess = {
    id: 'visa-proc-1',
    bookingId: 'book-uuid-1',
    passengerId: 'pass-uuid-1',
    confirmationCode: 'AA00998877',
    consularFeePaid: false,
    consularFeeAmount: 185.0,
    currency: 'USD',
    currentStep: 'REGISTRO_DS160',
    createdAt: '2026-10-16T00:00:00Z',
    updatedAt: '2026-10-16T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaDs160FormComponent],
      providers: [
        VisaService,
        BookingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    visaService = TestBed.inject(VisaService);
    bookingService = TestBed.inject(BookingService);
  });

  beforeEach(() => {
    vi.spyOn(bookingService, 'getBookings').mockReturnValue(
      of({
        data: [mockBooking],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
      })
    );

    fixture = TestBed.createComponent(VisaDs160FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializar el formulario con arancel $185 USD y divisa USD', () => {
    expect(component.ds160Form).toBeDefined();
    expect(component.ds160Form.get('consularFeeAmount')?.value).toBe(185.0);
    expect(component.ds160Form.get('currency')?.value).toBe('USD');
  });

  it('debe marcar invalido un codigo DS-160 que no tenga exactamente 10 caracteres alfanumericos', () => {
    const codeControl = component.ds160Form.get('confirmationCode');

    // Menos de 10 caracteres
    codeControl?.setValue('AA001');
    expect(codeControl?.invalid).toBe(true);
    expect(component.isCodePatternValid()).toBe(false);

    // Caracter especial invalido
    codeControl?.setValue('AA0012345-');
    expect(codeControl?.invalid).toBe(true);
    expect(component.isCodePatternValid()).toBe(false);

    // 10 caracteres alfanumericos exactos
    codeControl?.setValue('AA00998877');
    expect(codeControl?.valid).toBe(true);
    expect(component.isCodePatternValid()).toBe(true);
  });

  it('debe actualizar los pasajeros disponibles al seleccionar una reserva', () => {
    component.ds160Form.get('bookingId')?.setValue('book-uuid-1');
    fixture.detectChanges();

    expect(component.availablePassengers().length).toBe(1);
    expect(component.availablePassengers()[0].firstName).toBe('Juan');
  });

  it('debe emitir processCreated tras envio exitoso del formulario', () => {
    const emitSpy = vi.fn();
    component.processCreated.subscribe(emitSpy);

    vi.spyOn(visaService, 'createVisaProcess').mockReturnValue(of(mockCreatedProcess));

    component.ds160Form.patchValue({
      bookingId: 'book-uuid-1',
      passengerId: 'pass-uuid-1',
      confirmationCode: 'AA00998877'
    });

    component.submitForm();

    expect(visaService.createVisaProcess).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(mockCreatedProcess);
    expect(component.successMessage()).toContain('AA00998877');
  });
});
