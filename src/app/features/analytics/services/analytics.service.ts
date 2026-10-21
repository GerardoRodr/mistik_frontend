import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FinancialSummaryResponse,
  KanbanBottlenecksResponse,
  VisaConversionResponse
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/analytics`;

  // Resumen financiero de ingresos devengados vs cobrados (GET /api/v1/analytics/financial-summary)
  getFinancialSummary(): Observable<FinancialSummaryResponse> {
    return this.http.get<FinancialSummaryResponse>(
      `${this.baseUrl}/financial-summary`
    );
  }

  // Embudo de conversion consular en 4 fases (GET /api/v1/analytics/visa-conversion)
  getVisaConversion(): Observable<VisaConversionResponse> {
    return this.http.get<VisaConversionResponse>(
      `${this.baseUrl}/visa-conversion`
    );
  }

  // Diagnostico de cuellos de botella en tablero Kanban (GET /api/v1/analytics/kanban-bottlenecks)
  getKanbanBottlenecks(): Observable<KanbanBottlenecksResponse> {
    return this.http.get<KanbanBottlenecksResponse>(
      `${this.baseUrl}/kanban-bottlenecks`
    );
  }
}
