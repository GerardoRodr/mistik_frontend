// Modelos para el modulo de Analitica y Business Intelligence (BI)

export interface ServiceBreakdownItem {
  serviceType: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface FinancialSummaryData {
  totalAccrued: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  currency: string;
  activeBookingsCount: number;
  totalPaymentsCount: number;
}

export interface FinancialSummaryResponse {
  financialSummary: FinancialSummaryData;
  breakdownByService: ServiceBreakdownItem[];
}

export interface FunnelStepItem {
  step: string;
  name: string;
  count: number;
  percentage: number;
}

export interface VisaConversionResponse {
  totalExpedientes: number;
  totalAppointments: number;
  stepDistribution?: Record<string, number>;
  funnel: FunnelStepItem[];
  completionRate: number;
}

export interface ColumnAnalysisItem {
  column: string;
  taskCount: number;
  wipLimit: number | null;
  isBottleneck: boolean;
  utilizationPercentage: number | null;
  status: string;
}

export interface OverdueTaskItem {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  assignedTo?: string;
}

export interface KanbanBottleneckMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasksCount: number;
  averageLeadTimeHours: number;
}

export interface KanbanBottlenecksResponse {
  columnsAnalysis: ColumnAnalysisItem[];
  bottlenecksDetected: Array<{
    column: string;
    taskCount: number;
    wipLimit: number;
    isBottleneck: boolean;
  }>;
  hasBottlenecks: boolean;
  metrics: KanbanBottleneckMetrics;
  overdueTasks: OverdueTaskItem[];
}
