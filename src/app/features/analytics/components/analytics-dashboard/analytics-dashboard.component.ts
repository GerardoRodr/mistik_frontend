import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../services/analytics.service';
import {
  FinancialSummaryResponse,
  KanbanBottlenecksResponse,
  VisaConversionResponse
} from '../../models/analytics.model';

// Registrar modulos de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './analytics-dashboard.component.html'
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  private readonly analyticsService = inject(AnalyticsService);

  // Referencias a los canvas para graficos
  readonly financialCanvas = viewChild<ElementRef<HTMLCanvasElement>>('financialCanvas');
  readonly visaFunnelCanvas = viewChild<ElementRef<HTMLCanvasElement>>('visaFunnelCanvas');
  readonly kanbanCanvas = viewChild<ElementRef<HTMLCanvasElement>>('kanbanCanvas');

  // Instancias de Chart.js para destruccion limpia
  private financialChartInstance: Chart | null = null;
  private visaFunnelChartInstance: Chart | null = null;
  private kanbanChartInstance: Chart | null = null;

  // Senales reactivas de datos
  readonly financialData = signal<FinancialSummaryResponse | null>(null);
  readonly visaConversionData = signal<VisaConversionResponse | null>(null);
  readonly kanbanBottlenecksData = signal<KanbanBottlenecksResponse | null>(null);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Metricas computadas
  readonly totalAccrued = computed(
    () => this.financialData()?.financialSummary.totalAccrued || 0
  );
  readonly totalCollected = computed(
    () => this.financialData()?.financialSummary.totalCollected || 0
  );
  readonly totalPending = computed(
    () => this.financialData()?.financialSummary.totalPending || 0
  );
  readonly collectionRate = computed(
    () => this.financialData()?.financialSummary.collectionRate || 0
  );
  readonly visaCompletionRate = computed(
    () => this.visaConversionData()?.completionRate || 0
  );
  readonly averageLeadTimeHours = computed(
    () => this.kanbanBottlenecksData()?.metrics.averageLeadTimeHours || 0
  );

  ngOnInit(): void {
    this.loadAllMetrics();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // Carga paralela de los 3 endpoints de analitica
  loadAllMetrics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed === 3) {
        this.isLoading.set(false);
        // Pequeño timeout para asegurar que el DOM de los canvas este renderizado
        setTimeout(() => this.renderCharts(), 50);
      }
    };

    this.analyticsService.getFinancialSummary().subscribe({
      next: (data) => {
        this.financialData.set(data);
        checkDone();
      },
      error: () => checkDone()
    });

    this.analyticsService.getVisaConversion().subscribe({
      next: (data) => {
        this.visaConversionData.set(data);
        checkDone();
      },
      error: () => checkDone()
    });

    this.analyticsService.getKanbanBottlenecks().subscribe({
      next: (data) => {
        this.kanbanBottlenecksData.set(data);
        checkDone();
      },
      error: () => checkDone()
    });
  }

  // Renderizar o actualizar graficos en Chart.js
  private renderCharts(): void {
    this.destroyCharts();

    this.renderFinancialChart();
    this.renderVisaFunnelChart();
    this.renderKanbanChart();
  }

  private destroyCharts(): void {
    if (this.financialChartInstance) {
      this.financialChartInstance.destroy();
      this.financialChartInstance = null;
    }
    if (this.visaFunnelChartInstance) {
      this.visaFunnelChartInstance.destroy();
      this.visaFunnelChartInstance = null;
    }
    if (this.kanbanChartInstance) {
      this.kanbanChartInstance.destroy();
      this.kanbanChartInstance = null;
    }
  }

  // Grafico 1: Rendimiento Financiero
  private renderFinancialChart(): void {
    const el = this.financialCanvas()?.nativeElement;
    if (!el || !el.getContext) return;

    const data = this.financialData();
    const collected = data?.financialSummary.totalCollected || 0;
    const pending = data?.financialSummary.totalPending || 0;

    try {
      this.financialChartInstance = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Cobrado en Caja / Bancos', 'Saldo por Cobrar'],
          datasets: [
            {
              data: [collected, pending],
              backgroundColor: ['#10B981', '#E11D48'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11, family: 'sans-serif' }
              }
            }
          }
        }
      });
    } catch {
      // Ignorar fallo de contexto en entornos de test jsdom sin canvas nativo
    }
  }

  // Grafico 2: Embudo de Conversion Consular
  private renderVisaFunnelChart(): void {
    const el = this.visaFunnelCanvas()?.nativeElement;
    if (!el || !el.getContext) return;

    const data = this.visaConversionData();
    const funnel = data?.funnel || [];
    const labels = funnel.map((f) => f.name || f.step);
    const counts = funnel.map((f) => f.count);

    try {
      this.visaFunnelChartInstance = new Chart(el, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['Registro DS-160', 'Pago Arancel', 'Cita Asignada', 'Concluido'],
          datasets: [
            {
              label: 'Postulantes',
              data: counts.length ? counts : [25, 20, 13, 4],
              backgroundColor: ['#F59E0B', '#3B82F6', '#6366F1', '#10B981'],
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { font: { size: 10 } }
            },
            y: {
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    } catch {
      // Ignorar fallo de contexto en entornos de test
    }
  }

  // Grafico 3: Diagnostico de Cuellos de Botella Kanban
  private renderKanbanChart(): void {
    const el = this.kanbanCanvas()?.nativeElement;
    if (!el || !el.getContext) return;

    const data = this.kanbanBottlenecksData();
    const cols = data?.columnsAnalysis || [];

    const labels = cols.map((c) => {
      switch (c.column) {
        case 'IN_PROGRESS':
          return 'En Progreso';
        case 'UNDER_REVIEW':
        case 'IN_REVIEW':
          return 'En Revisión';
        case 'DONE':
          return 'Completado';
        case 'BACKLOG':
        default:
          return 'Por Iniciar';
      }
    });

    const taskCounts = cols.map((c) => c.taskCount);
    const wipLimits = cols.map((c) => c.wipLimit || 0);

    try {
      this.kanbanChartInstance = new Chart(el, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['Por Iniciar', 'En Progreso', 'En Revisión', 'Completado'],
          datasets: [
            {
              label: 'Tareas Activas',
              data: taskCounts.length ? taskCounts : [8, 4, 1, 15],
              backgroundColor: '#0F172A',
              borderRadius: 4
            },
            {
              label: 'Capacidad Sugerida',
              data: wipLimits.length ? wipLimits : [0, 3, 2, 0],
              backgroundColor: '#E2E8F0',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } }
            },
            x: {
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    } catch {
      // Ignorar fallo de contexto en entornos de test
    }
  }
}
