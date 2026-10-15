import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisaListComponent } from './visa-list.component';
import { VisaService } from '../../../core/services/visa.service';
import { VisaProcess, TransitionVisaResponse } from '../../../core/models/visa.models';

describe('VisaListComponent', () => {
  let component: VisaListComponent;
  let fixture: ComponentFixture<VisaListComponent>;
  let visaService: VisaService;

  const mockVisaProcesses: VisaProcess[] = [
    {
      id: 'proc-1',
      bookingId: 'book-1',
      passengerId: 'pass-1',
      confirmationCode: 'AA00112233',
      consularFeePaid: false,
      consularFeeAmount: 185.0,
      currency: 'USD',
      currentStep: 'REGISTRO_DS160',
      createdAt: '2026-10-16T00:00:00Z',
      updatedAt: '2026-10-16T00:00:00Z',
      booking: {
        id: 'book-1',
        bookingCode: 'RES-001',
        customer: {
          firstName: 'Juan',
          lastName: 'Perez',
          documentNumber: '11223344'
        }
      }
    },
    {
      id: 'proc-2',
      bookingId: 'book-2',
      passengerId: 'pass-2',
      confirmationCode: 'BB22334455',
      consularFeePaid: true,
      consularFeeAmount: 185.0,
      currency: 'USD',
      currentStep: 'CITA_CONSOLIDADA',
      embassyDate: '2027-05-10T10:00:00Z',
      createdAt: '2026-10-16T00:00:00Z',
      updatedAt: '2026-10-16T00:00:00Z',
      booking: {
        id: 'book-2',
        bookingCode: 'RES-002',
        customer: {
          firstName: 'Elena',
          lastName: 'Rojas',
          documentNumber: '55667788'
        }
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaListComponent],
      providers: [
        VisaService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    visaService = TestBed.inject(VisaService);
  });

  beforeEach(() => {
    vi.spyOn(visaService, 'getVisaProcesses').mockReturnValue(
      of({
        data: mockVisaProcesses,
        meta: {
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1
        }
      })
    );

    fixture = TestBed.createComponent(VisaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar los expedientes consulares al inicializarse', () => {
    expect(visaService.getVisaProcesses).toHaveBeenCalledWith({ limit: 100 });
    expect(component.visaProcesses().length).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('debe calcular las metricas KPI con senales reactivas', () => {
    expect(component.ds160Count()).toBe(1);
    expect(component.feePaidCount()).toBe(1);
    expect(component.appointmentsCount()).toBe(1);
    expect(component.completedCount()).toBe(0);
  });

  it('debe filtrar expedientes por fase y termino de busqueda', () => {
    // Filtrar por termino
    component.searchTerm.set('Elena');
    fixture.detectChanges();
    expect(component.filteredProcesses().length).toBe(1);
    expect(component.filteredProcesses()[0].confirmationCode).toBe('BB22334455');

    // Filtrar por fase
    component.searchTerm.set('');
    component.setStepFilter('REGISTRO_DS160');
    fixture.detectChanges();
    expect(component.filteredProcesses().length).toBe(1);
    expect(component.filteredProcesses()[0].confirmationCode).toBe('AA00112233');
  });

  it('debe avanzar la fase consular con advanceStep', () => {
    const updatedProcess: VisaProcess = {
      ...mockVisaProcesses[0],
      currentStep: 'PAGO_ARANCEL'
    };
    const response: TransitionVisaResponse = {
      transition: {
        success: true,
        previousStep: 'REGISTRO_DS160',
        newStep: 'PAGO_ARANCEL',
        allowedNextSteps: ['CITA_CONSOLIDADA'],
        message: 'Transicion exitosa'
      },
      visaProcess: updatedProcess
    };

    vi.spyOn(visaService, 'updateVisaProcessStatus').mockReturnValue(of(response));

    component.advanceStep(mockVisaProcesses[0], 'PAGO_ARANCEL');

    expect(visaService.updateVisaProcessStatus).toHaveBeenCalledWith('proc-1', {
      targetStep: 'PAGO_ARANCEL'
    });
    expect(component.visaProcesses()[0].currentStep).toBe('PAGO_ARANCEL');
    expect(component.successMessage()).toContain('Pago Arancel MRV');
  });

  it('debe abrir y cerrar los modales de DS-160 y pago de arancel', () => {
    component.openDs160Modal();
    expect(component.showDs160Modal()).toBe(true);
    component.closeDs160Modal();
    expect(component.showDs160Modal()).toBe(false);

    component.openFeeModal(mockVisaProcesses[0]);
    expect(component.selectedProcessForPayment()).toBe(mockVisaProcesses[0]);
    component.closeFeeModal();
    expect(component.selectedProcessForPayment()).toBeNull();
  });

  it('debe abrir, cerrar y procesar la conclusion con el modal', () => {
    component.openConcludeModal(mockVisaProcesses[1]);
    expect(component.selectedProcessForConclude()).toBe(mockVisaProcesses[1]);

    component.closeConcludeModal();
    expect(component.selectedProcessForConclude()).toBeNull();

    component.openConcludeModal(mockVisaProcesses[1]);
    component.onProcessConcluded();
    expect(component.selectedProcessForConclude()).toBeNull();
    expect(component.successMessage()).toContain('BB22334455');
  });
});
