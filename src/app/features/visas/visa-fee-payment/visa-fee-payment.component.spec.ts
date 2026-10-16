import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisaFeePaymentComponent } from './visa-fee-payment.component';
import { VisaService } from '../../../core/services/visa.service';
import { ScheduleAppointmentResponse, VisaProcess } from '../../../core/models/visa.models';

describe('VisaFeePaymentComponent', () => {
  let component: VisaFeePaymentComponent;
  let fixture: ComponentFixture<VisaFeePaymentComponent>;
  let visaService: VisaService;

  const mockVisaProcess: VisaProcess = {
    id: 'proc-uuid-1',
    bookingId: 'book-uuid-1',
    passengerId: 'pass-uuid-1',
    confirmationCode: 'AA00998877',
    consularFeePaid: false,
    consularFeeAmount: 185.0,
    currency: 'USD',
    currentStep: 'REGISTRO_DS160',
    createdAt: '2026-10-16T00:00:00Z',
    updatedAt: '2026-10-16T00:00:00Z',
    booking: {
      id: 'book-uuid-1',
      bookingCode: 'RES-2026-001',
      customer: {
        firstName: 'Maria',
        lastName: 'Gomez',
        documentNumber: '44556677'
      }
    }
  };

  const mockResponse: ScheduleAppointmentResponse = {
    message: 'Cita programada exitosamente',
    appointment: {
      id: 'appt-1',
      title: 'Entrevista Consular',
      appointmentDate: '2027-04-18T10:00:00.000Z',
      location: 'Embajada de Estados Unidos en Lima',
      status: 'SCHEDULED'
    },
    visaProcess: {
      ...mockVisaProcess,
      consularFeePaid: true,
      currentStep: 'CITA_CONSOLIDADA'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaFeePaymentComponent],
      providers: [
        VisaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    visaService = TestBed.inject(VisaService);
    fixture = TestBed.createComponent(VisaFeePaymentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visaProcess', mockVisaProcess);
    fixture.detectChanges();
  });

  it('debe inicializar el formulario con monto fijado en 185.00 USD', () => {
    expect(component.paymentForm.get('consularFeeAmount')?.value).toBe(185.0);
    expect(component.paymentForm.get('currency')?.value).toBe('USD');
    expect(component.feePen()).toBe('693.75');
  });

  it('debe validar la obligatoriedad del codigo de comprobante MRV entre 8 y 18 caracteres', () => {
    const mrvControl = component.paymentForm.get('mrvPaymentCode');
    mrvControl?.setValue('');
    expect(mrvControl?.invalid).toBe(true);

    mrvControl?.setValue('SHORT'); // < 8 caracteres
    expect(mrvControl?.invalid).toBe(true);

    mrvControl?.setValue('MRV2027998877'); // 13 caracteres alfanumericos
    expect(mrvControl?.valid).toBe(true);
  });

  it('debe permitir mrvPaymentCode opcional cuando el arancel consular ya fue pagado', () => {
    const processPaid: VisaProcess = {
      ...mockVisaProcess,
      consularFeePaid: true,
      currentStep: 'PAGO_ARANCEL'
    };
    const testFixture = TestBed.createComponent(VisaFeePaymentComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.componentRef.setInput('visaProcess', processPaid);
    testFixture.detectChanges();

    expect(testComponent.isFeeAlreadyPaid()).toBe(true);
    const mrvControl = testComponent.paymentForm.get('mrvPaymentCode');
    mrvControl?.setValue('');
    expect(mrvControl?.valid).toBe(true);
  });

  it('debe enviar la programacion de cita con comprobante MRV $185 USD al backend', () => {
    const emitSpy = vi.fn();
    component.paymentRegistered.subscribe(emitSpy);

    vi.spyOn(visaService, 'scheduleAppointment').mockReturnValue(of(mockResponse));

    component.paymentForm.patchValue({
      mrvPaymentCode: 'MRV2027998877',
      bankName: 'Scotiabank',
      paymentDate: '2026-10-16',
      appointmentDate: '2027-04-18T10:00',
      location: 'Embajada de Estados Unidos en Lima',
      title: 'Entrevista Consular - Embajada'
    });

    component.submitPayment();

    expect(visaService.scheduleAppointment).toHaveBeenCalledWith(
      'proc-uuid-1',
      expect.objectContaining({
        mrvPaymentCode: 'MRV2027998877',
        consularFeeAmount: 185.0
      })
    );
    expect(emitSpy).toHaveBeenCalledWith(mockResponse);
  });
});
