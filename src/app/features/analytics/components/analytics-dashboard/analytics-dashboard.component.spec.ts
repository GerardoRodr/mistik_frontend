import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { AnalyticsService } from '../../services/analytics.service';
import {
  FinancialSummaryResponse,
  KanbanBottlenecksResponse,
  VisaConversionResponse
} from '../../models/analytics.model';

describe('AnalyticsDashboardComponent', () => {
  let component: AnalyticsDashboardComponent;
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;
  let analyticsService: AnalyticsService;

  const mockFinancial: FinancialSummaryResponse = {
    financialSummary: {
      totalAccrued: 50000,
      totalCollected: 35000,
      totalPending: 15000,
      collectionRate: 70,
      currency: 'USD',
      activeBookingsCount: 15,
      totalPaymentsCount: 22
    },
    breakdownByService: [
      { serviceType: 'FLIGHT', count: 10, totalAmount: 30000, percentage: 60 },
      { serviceType: 'HOTEL', count: 5, totalAmount: 20000, percentage: 40 }
    ]
  };

  const mockVisa: VisaConversionResponse = {
    totalExpedientes: 30,
    totalAppointments: 18,
    completionRate: 60,
    funnel: [
      { step: 'DS160', name: 'Registro DS-160', count: 30, percentage: 100 },
      { step: 'FEE_PAID', name: 'Pago Arancel', count: 25, percentage: 83.3 },
      { step: 'APPOINTMENT', name: 'Cita Asignada', count: 18, percentage: 60 }
    ]
  };

  const mockKanban: KanbanBottlenecksResponse = {
    columnsAnalysis: [
      { column: 'BACKLOG', taskCount: 8, wipLimit: null, isBottleneck: false, utilizationPercentage: null, status: 'NORMAL' },
      { column: 'IN_PROGRESS', taskCount: 4, wipLimit: 3, isBottleneck: true, utilizationPercentage: 133, status: 'OVERLOAD' },
      { column: 'UNDER_REVIEW', taskCount: 1, wipLimit: 2, isBottleneck: false, utilizationPercentage: 50, status: 'NORMAL' },
      { column: 'DONE', taskCount: 20, wipLimit: null, isBottleneck: false, utilizationPercentage: null, status: 'NORMAL' }
    ],
    bottlenecksDetected: [
      { column: 'IN_PROGRESS', taskCount: 4, wipLimit: 3, isBottleneck: true }
    ],
    hasBottlenecks: true,
    metrics: {
      totalTasks: 33,
      completedTasks: 20,
      overdueTasksCount: 2,
      averageLeadTimeHours: 18.5
    },
    overdueTasks: [
      { id: 'task-1', title: 'Emitir boletos grupo Lima', status: 'IN_PROGRESS', dueDate: '2026-10-21T00:00:00Z', assignedTo: 'Carlos' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [
        AnalyticsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
  });

  it('debe crearse y consultar los 3 endpoints de analitica al iniciar', () => {
    vi.spyOn(analyticsService, 'getFinancialSummary').mockReturnValue(of(mockFinancial));
    vi.spyOn(analyticsService, 'getVisaConversion').mockReturnValue(of(mockVisa));
    vi.spyOn(analyticsService, 'getKanbanBottlenecks').mockReturnValue(of(mockKanban));

    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(analyticsService.getFinancialSummary).toHaveBeenCalled();
    expect(analyticsService.getVisaConversion).toHaveBeenCalled();
    expect(analyticsService.getKanbanBottlenecks).toHaveBeenCalled();

    expect(component.isLoading()).toBe(false);
    expect(component.totalAccrued()).toBe(50000);
    expect(component.totalCollected()).toBe(35000);
    expect(component.totalPending()).toBe(15000);
    expect(component.collectionRate()).toBe(70);
    expect(component.visaCompletionRate()).toBe(60);
    expect(component.averageLeadTimeHours()).toBe(18.5);
  });

  it('debe computar valores en 0 de manera segura si las respuestas son nulas', () => {
    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;

    component.financialData.set(null);
    component.visaConversionData.set(null);
    component.kanbanBottlenecksData.set(null);

    expect(component.totalAccrued()).toBe(0);
    expect(component.totalCollected()).toBe(0);
    expect(component.totalPending()).toBe(0);
    expect(component.collectionRate()).toBe(0);
    expect(component.visaCompletionRate()).toBe(0);
    expect(component.averageLeadTimeHours()).toBe(0);
  });

  it('debe renderizar la lista de tareas vencidas si existen cuellos de botella', () => {
    vi.spyOn(analyticsService, 'getFinancialSummary').mockReturnValue(of(mockFinancial));
    vi.spyOn(analyticsService, 'getVisaConversion').mockReturnValue(of(mockVisa));
    vi.spyOn(analyticsService, 'getKanbanBottlenecks').mockReturnValue(of(mockKanban));

    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const overdue = component.kanbanBottlenecksData()?.overdueTasks;
    expect(overdue?.length).toBe(1);
    expect(overdue?.[0].title).toBe('Emitir boletos grupo Lima');
  });
});
