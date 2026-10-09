import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookingCreateComponent } from './booking-create.component';
import { BookingService } from '../../../core/services/booking.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Booking, Wholesaler } from '../../../core/models/booking.models';

describe('BookingCreateComponent', () => {
  let component: BookingCreateComponent;
  let fixture: ComponentFixture<BookingCreateComponent>;
  let bookingService: BookingService;
  let customerService: CustomerService;

  const mockWholesalers: Wholesaler[] = [
    { id: 'wh-costamar', code: 'COSTAMAR', name: 'Costamar Travel', type: 'WHOLESALER', category: 'CONSOLIDADORA' },
    { id: 'wh-agil', code: 'AGIL', name: 'Agil Operador Mayorista', type: 'WHOLESALER', category: 'CONSOLIDADORA' },
    { id: 'wh-euroamerican', code: 'EUROAMERICAN', name: 'Euroamerican Assistance', type: 'WHOLESALER', category: 'CONSOLIDADORA' },
    { id: 'wh-ctm', code: 'CTM', name: 'CTM Tours', type: 'WHOLESALER', category: 'CONSOLIDADORA' },
    { id: 'wh-latam', code: 'LATAM', name: 'LATAM Airlines Group', type: 'AIRLINE', category: 'AEROLINEA' },
    { id: 'wh-copa', code: 'COPA', name: 'Copa Airlines', type: 'AIRLINE', category: 'AEROLINEA' },
    { id: 'wh-avianca', code: 'AVIANCA', name: 'Avianca', type: 'AIRLINE', category: 'AEROLINEA' }
  ];

  const mockBooking: Booking = {
    id: 'booking-uuid-1',
    bookingCode: 'RES-123456',
    pnr: 'LIM456',
    customerId: 'cust-uuid-1',
    serviceType: 'FLIGHT',
    status: 'PENDING',
    totalAmount: 650,
    currency: 'USD',
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCreateComponent],
      providers: [
        BookingService,
        CustomerService,
        provideRouter([{ path: 'reservas', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService);
    customerService = TestBed.inject(CustomerService);
  });

  beforeEach(() => {
    vi.spyOn(bookingService, 'getWholesalers').mockReturnValue(of(mockWholesalers));
    fixture = TestBed.createComponent(BookingCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializar el formulario con valores por defecto y un pasajero', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('serviceType')?.value).toBe('FLIGHT');
    expect(component.form.get('currency')?.value).toBe('USD');
    expect(component.passengersArray.length).toBe(1);
  });

  it('debe validar estrictamente que el PNR tenga exactamente 6 caracteres (WBS 6.1.1.1)', () => {
    const pnrControl = component.form.get('pnr');
    expect(pnrControl?.valid).toBe(false);

    pnrControl?.setValue('LIM'); // Corto (3)
    expect(pnrControl?.valid).toBe(false);

    pnrControl?.setValue('LIM1234'); // Largo (7)
    expect(pnrControl?.valid).toBe(false);

    pnrControl?.setValue('LIM#12'); // Caracteres invalidos
    expect(pnrControl?.valid).toBe(false);

    pnrControl?.setValue('LIM456'); // Correcto (6 alfanumericos)
    expect(pnrControl?.valid).toBe(true);
  });

  it('debe convertir a mayusculas el valor de entrada en onPnrInput (WBS 6.1.1.1)', () => {
    const fakeEvent = {
      target: { value: 'lim456' }
    } as unknown as Event;

    component.onPnrInput(fakeEvent);
    expect(component.form.get('pnr')?.value).toBe('LIM456');
  });

  it('debe cargar el catalogo de mayoristas y permitir seleccionar una consolidadora (WBS 6.1.1.2)', () => {
    expect(component.wholesalers().length).toBeGreaterThanOrEqual(5);

    const costamar = component.wholesalers().find((w) => w.code === 'COSTAMAR')!;
    component.selectWholesaler(costamar);

    expect(component.selectedWholesaler()).toEqual(costamar);
    expect(component.form.get('wholesalerId')?.value).toBe(costamar.id);
  });

  it('debe bloquear el envio si el formulario no esta completo', () => {
    const createSpy = vi.spyOn(bookingService, 'createBooking');
    component.onSubmit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('completa todos los campos requeridos');
  });

  it('debe registrar la reserva aerea y emitir saved cuando los datos son validos', () => {
    vi.spyOn(bookingService, 'createBooking').mockReturnValue(of(mockBooking));
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    // Llenar datos validos
    component.form.patchValue({
      customerId: 'cust-uuid-1',
      pnr: 'LIM456',
      wholesalerId: 'wh-costamar',
      totalAmount: 650,
      currency: 'USD',
      origin: 'TRU',
      destination: 'LIM',
      departureDate: '2026-11-01'
    });

    component.passengersArray.at(0).patchValue({
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez'
    });

    component.onSubmit();

    expect(bookingService.createBooking).toHaveBeenCalled();
    expect(savedSpy).toHaveBeenCalledWith(mockBooking);
    expect(component.isSubmitting()).toBe(false);
  });
});
