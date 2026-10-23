import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BalanceSummaryComponent } from './balance-summary.component';
import { BookingService } from '../../../../core/services/booking.service';
import { BookingBalance, RegisterPaymentResponse } from '../../../../core/models/booking.models';

describe('BalanceSummaryComponent', () => {
  let component: BalanceSummaryComponent;
  let fixture: ComponentFixture<BalanceSummaryComponent>;
  let bookingService: BookingService;

  const mockBalance: BookingBalance = {
    bookingId: 'book-123',
    bookingCode: 'RES-2026-001',
    totalAmount: 1000,
    totalPaid: 400,
    balanceDue: 600,
    currency: 'USD',
    paymentStatus: 'PARTIAL',
    paymentsCount: 1,
    payments: [
      {
        id: 'pay-1',
        bookingId: 'book-123',
        amount: 400,
        currency: 'USD',
        paymentMethod: 'TRANSFER',
        operationNumber: 'OP-998877',
        bankName: 'BCP',
        paymentDate: '2026-10-20T10:00:00Z',
        driveReceiptUrl: 'https://drive.google.com/file/d/1A2B3C/view'
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceSummaryComponent],
      providers: [
        BookingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService);
    fixture = TestBed.createComponent(BalanceSummaryComponent);
    component = fixture.componentInstance;
    // Set required input
    fixture.componentRef.setInput('bookingId', 'book-123');
    fixture.componentRef.setInput('bookingCode', 'RES-2026-001');
  });

  it('debe crearse y cargar el balance inicial de la reserva', () => {
    vi.spyOn(bookingService, 'getBookingBalance').mockReturnValue(of(mockBalance));
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(bookingService.getBookingBalance).toHaveBeenCalledWith('book-123');
    expect(component.balance()?.totalAmount).toBe(1000);
    expect(component.balance()?.totalPaid).toBe(400);
    expect(component.balance()?.balanceDue).toBe(600);
    expect(component.balance()?.paymentStatus).toBe('PARTIAL');
  });

  it('debe calcular correctamente el porcentaje pagado computado', () => {
    vi.spyOn(bookingService, 'getBookingBalance').mockReturnValue(of(mockBalance));
    fixture.detectChanges();

    // 400 / 1000 = 40%
    expect(component.paidPercentage()).toBe(40);
  });

  it('debe alternar la visibilidad del modal de registro de abono', () => {
    vi.spyOn(bookingService, 'getBookingBalance').mockReturnValue(of(mockBalance));
    fixture.detectChanges();

    expect(component.showPaymentModal()).toBe(false);
    component.openPaymentModal();
    expect(component.showPaymentModal()).toBe(true);
    component.closePaymentModal();
    expect(component.showPaymentModal()).toBe(false);
  });

  it('debe actualizar el saldo reactivamente cuando se registra un pago exitoso', () => {
    vi.spyOn(bookingService, 'getBookingBalance').mockReturnValue(of(mockBalance));
    fixture.detectChanges();

    const mockResponse: RegisterPaymentResponse = {
      payment: {
        id: 'pay-2',
        bookingId: 'book-123',
        amount: 600,
        currency: 'USD',
        paymentMethod: 'TRANSFER',
        operationNumber: 'OP-112233',
        bankName: 'BBVA',
        paymentDate: '2026-10-24T12:00:00Z',
        driveReceiptUrl: 'https://drive.google.com/file/d/2B3C4D/view'
      },
      balance: {
        bookingId: 'book-123',
        bookingCode: 'RES-2026-001',
        totalAmount: 1000,
        totalPaid: 1000,
        balanceDue: 0,
        currency: 'USD',
        paymentStatus: 'PAID',
        paymentsCount: 2,
        payments: [
          ...(mockBalance.payments || []),
          {
            id: 'pay-2',
            bookingId: 'book-123',
            amount: 600,
            currency: 'USD',
            paymentMethod: 'TRANSFER',
            operationNumber: 'OP-112233',
            bankName: 'BBVA',
            paymentDate: '2026-10-24T12:00:00Z',
            driveReceiptUrl: 'https://drive.google.com/file/d/2B3C4D/view'
          }
        ]
      }
    };

    component.onPaymentRegistered(mockResponse);

    expect(component.showPaymentModal()).toBe(false);
    expect(component.balance()?.balanceDue).toBe(0);
    expect(component.balance()?.paymentStatus).toBe('PAID');
    expect(component.paidPercentage()).toBe(100);
    expect(component.successMessage()).toContain('Abono registrado');
  });

  it('debe emitir evento closed al cerrar el visor', () => {
    vi.spyOn(bookingService, 'getBookingBalance').mockReturnValue(of(mockBalance));
    fixture.detectChanges();

    let closed = false;
    component.closed.subscribe(() => {
      closed = true;
    });

    component.close();
    expect(closed).toBe(true);
  });
});
