import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItineraryCardComponent } from './itinerary-card.component';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.models';

describe('ItineraryCardComponent', () => {
  let component: ItineraryCardComponent;
  let fixture: ComponentFixture<ItineraryCardComponent>;
  let bookingService: BookingService;

  const mockBooking: Booking = {
    id: 'booking-uuid-1',
    bookingCode: 'RES-889900',
    pnr: 'TRU123',
    customerId: 'cust-uuid-1',
    serviceType: 'FLIGHT',
    status: 'PENDING',
    totalAmount: 450,
    currency: 'USD',
    origin: 'TRU',
    destination: 'LIM',
    departureDate: '2026-11-15',
    wholesalerName: 'Costamar Travel',
    passengers: [
      {
        documentType: 'DNI',
        documentNumber: '74859612',
        firstName: 'Lucia',
        lastName: 'Mendez',
        pnr: 'TRU123'
      }
    ],
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItineraryCardComponent],
      providers: [
        BookingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItineraryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('booking', mockBooking);
    fixture.detectChanges();
  });

  it('debe renderizar el codigo PNR y el tramo de vuelo (WBS 6.1.1.3)', () => {
    expect(component.displayPnr()).toBe('TRU123');
    expect(component.getStatusLabel(mockBooking.status)).toBe('PENDIENTE');
  });

  it('debe abrir el modal de transicion consultando transiciones permitidas', () => {
    vi.spyOn(bookingService, 'getAllowedTransitions').mockReturnValue(
      of({
        bookingId: mockBooking.id,
        currentStatus: 'PENDING',
        allowedTransitions: ['CONFIRMED', 'CANCELLED']
      })
    );

    component.openTransitionModal();

    expect(bookingService.getAllowedTransitions).toHaveBeenCalledWith(mockBooking.id);
    expect(component.allowedTransitions()).toEqual(['CONFIRMED', 'CANCELLED']);
    expect(component.showTransitionModal()).toBe(true);
    expect(component.selectedTargetStatus()).toBe('CONFIRMED');
  });

  it('debe exigir motivo de cancelacion si se elige CANCELLED', () => {
    component.selectedTargetStatus.set('CANCELLED');
    component.cancellationReason.set('abc'); // Menos de 5 caracteres

    component.confirmTransition();

    expect(component.transitionError()).toContain('al menos 5 caracteres');
  });

  it('debe ejecutar transicion de estado y emitir statusChanged', () => {
    const transitionSpy = vi.spyOn(bookingService, 'transitionBooking').mockReturnValue(
      of({
        transition: {
          success: true,
          previousStatus: 'PENDING',
          newStatus: 'CONFIRMED',
          allowedNextStates: ['IN_PROCESS', 'CANCELLED'],
          message: 'Transicion exitosa'
        },
        booking: { ...mockBooking, status: 'CONFIRMED' }
      })
    );

    const statusChangedSpy = vi.fn();
    component.statusChanged.subscribe(statusChangedSpy);

    component.selectedTargetStatus.set('CONFIRMED');
    component.confirmTransition();

    expect(transitionSpy).toHaveBeenCalled();
    expect(statusChangedSpy).toHaveBeenCalled();
    expect(component.showTransitionModal()).toBe(false);
  });
});
