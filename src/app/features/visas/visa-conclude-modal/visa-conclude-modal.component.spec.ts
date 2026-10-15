import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisaConcludeModalComponent } from './visa-conclude-modal.component';
import { VisaService } from '../../../core/services/visa.service';
import { VisaProcess, TransitionVisaResponse } from '../../../core/models/visa.models';

describe('VisaConcludeModalComponent', () => {
  let component: VisaConcludeModalComponent;
  let fixture: ComponentFixture<VisaConcludeModalComponent>;
  let visaService: VisaService;

  const mockProcess: VisaProcess = {
    id: 'proc-123',
    bookingId: 'book-1',
    passengerId: 'pass-1',
    confirmationCode: 'AA00112233',
    consularFeePaid: true,
    consularFeeAmount: 185.0,
    currency: 'USD',
    currentStep: 'CITA_CONSOLIDADA',
    embassyDate: '2026-10-17T10:00:00Z',
    createdAt: '2026-10-16T00:00:00Z',
    updatedAt: '2026-10-16T00:00:00Z',
    booking: {
      id: 'book-1',
      bookingCode: 'RES-001',
      customer: {
        firstName: 'Carlos',
        lastName: 'Mendoza',
        documentNumber: '12345678'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaConcludeModalComponent],
      providers: [
        VisaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    visaService = TestBed.inject(VisaService);
    fixture = TestBed.createComponent(VisaConcludeModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visaProcess', mockProcess);
    fixture.detectChanges();
  });

  it('debe inicializarse con resolucion APROBADA por defecto', () => {
    expect(component.concludeForm.get('resolution')?.value).toBe('APROBADA');
    expect(component.isSubmitting()).toBe(false);
  });

  it('debe emitir evento closed al cancelar', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    component.close();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('debe enviar transicion a CONCLUIDO y emitir concluded', () => {
    const concludedSpy = vi.fn();
    component.concluded.subscribe(concludedSpy);

    const mockResponse: TransitionVisaResponse = {
      transition: {
        success: true,
        previousStep: 'CITA_CONSOLIDADA',
        newStep: 'CONCLUIDO',
        allowedNextSteps: [],
        message: 'Concluido exitosamente'
      },
      visaProcess: {
        ...mockProcess,
        currentStep: 'CONCLUIDO'
      }
    };

    vi.spyOn(visaService, 'updateVisaProcessStatus').mockReturnValue(of(mockResponse));

    component.concludeForm.patchValue({
      resolution: 'APROBADA',
      notes: 'Visa aprobada, entrega en 5 dias'
    });

    component.submitConclusion();

    expect(visaService.updateVisaProcessStatus).toHaveBeenCalledWith('proc-123', {
      targetStep: 'CONCLUIDO',
      notes: 'Resolucion: APROBADA. Visa aprobada, entrega en 5 dias'
    });
    expect(concludedSpy).toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('debe manejar error al fallar el servicio', () => {
    vi.spyOn(visaService, 'updateVisaProcessStatus').mockReturnValue(
      throwError(() => ({
        error: { message: 'No se pudo concluir el expediente' }
      }))
    );

    component.submitConclusion();

    expect(component.errorMessage()).toBe('No se pudo concluir el expediente');
    expect(component.isSubmitting()).toBe(false);
  });
});
