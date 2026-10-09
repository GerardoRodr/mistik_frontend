import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookingListComponent } from './booking-list.component';
import { BookingService } from '../../../core/services/booking.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Booking } from '../../../core/models/booking.models';

describe('BookingListComponent', () => {
  let component: BookingListComponent;
  let fixture: ComponentFixture<BookingListComponent>;
  let bookingService: BookingService;

  const mockBookings: Booking[] = [
    {
      id: 'b-1',
      bookingCode: 'RES-001',
      pnr: 'LIM456',
      customerId: 'cust-1',
      serviceType: 'FLIGHT',
      status: 'PENDING',
      totalAmount: 600,
      currency: 'USD',
      origin: 'TRU',
      destination: 'LIM',
      customer: {
        id: 'cust-1',
        documentType: 'DNI',
        documentNumber: '74859612',
        firstName: 'Lucia',
        lastName: 'Mendez'
      },
      createdAt: '2026-10-09T00:00:00Z',
      updatedAt: '2026-10-09T00:00:00Z'
    },
    {
      id: 'b-2',
      bookingCode: 'RES-002',
      pnr: 'AQP789',
      customerId: 'cust-2',
      serviceType: 'FLIGHT',
      status: 'CONFIRMED',
      totalAmount: 750,
      currency: 'USD',
      origin: 'LIM',
      destination: 'AQP',
      customer: {
        id: 'cust-2',
        documentType: 'DNI',
        documentNumber: '11223344',
        firstName: 'Carlos',
        lastName: 'Mendoza'
      },
      createdAt: '2026-10-09T00:00:00Z',
      updatedAt: '2026-10-09T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingListComponent],
      providers: [
        BookingService,
        CustomerService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService);
  });

  beforeEach(() => {
    vi.spyOn(bookingService, 'getBookings').mockReturnValue(
      of({
        data: mockBookings,
        meta: { total: 2, page: 1, limit: 50, totalPages: 1 }
      })
    );

    fixture = TestBed.createComponent(BookingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar y renderizar reservas en la inicializacion', () => {
    expect(bookingService.getBookings).toHaveBeenCalled();
    expect(component.bookings().length).toBe(2);
    expect(component.isLoading()).toBe(false);
    expect(component.totalCount()).toBe(2);
    expect(component.pendingCount()).toBe(1);
    expect(component.confirmedCount()).toBe(1);
  });

  it('debe filtrar reactivamente por estado seleccionado', () => {
    component.setStatusFilter('CONFIRMED');
    expect(component.filteredBookings().length).toBe(1);
    expect(component.filteredBookings()[0].bookingCode).toBe('RES-002');

    component.setStatusFilter('ALL');
    expect(component.filteredBookings().length).toBe(2);
  });

  it('debe filtrar reactivamente por termino de busqueda PNR', () => {
    component.searchTerm.set('lim456');
    expect(component.filteredBookings().length).toBe(1);
    expect(component.filteredBookings()[0].pnr).toBe('LIM456');
  });

  it('debe abrir y cerrar modal de creacion de reserva', () => {
    expect(component.showCreateModal()).toBe(false);

    component.openCreateModal();
    expect(component.showCreateModal()).toBe(true);

    component.closeCreateModal();
    expect(component.showCreateModal()).toBe(false);
  });

  it('debe agregar nueva reserva a la lista al emitir onBookingSaved', () => {
    const newBooking: Booking = {
      id: 'b-3',
      bookingCode: 'RES-003',
      pnr: 'CUZ999',
      customerId: 'cust-3',
      serviceType: 'FLIGHT',
      status: 'PENDING',
      totalAmount: 850,
      currency: 'USD',
      createdAt: '2026-10-09T00:00:00Z',
      updatedAt: '2026-10-09T00:00:00Z'
    };

    component.onBookingSaved(newBooking);

    expect(component.bookings().length).toBe(3);
    expect(component.bookings()[0].pnr).toBe('CUZ999');
    expect(component.successMessage()).toContain('CUZ999');
  });
});
