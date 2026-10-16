import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateVisaProcessDto,
  MultiannualAppointmentsQuery,
  MultiannualAppointmentsResponse,
  PaginatedVisaProcessesResponse,
  ScheduleAppointmentDto,
  ScheduleAppointmentResponse,
  TransitionVisaDto,
  TransitionVisaResponse,
  VisaProcess,
  VisaQueryParams
} from '../models/visa.models';

@Injectable({
  providedIn: 'root'
})
export class VisaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/visa-processes`;

  // Listar expedientes de tramite consular con paginacion y filtros
  getVisaProcesses(params?: VisaQueryParams): Observable<PaginatedVisaProcessesResponse> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.currentStep) {
      httpParams = httpParams.set('currentStep', params.currentStep);
    }
    if (params?.bookingId) {
      httpParams = httpParams.set('bookingId', params.bookingId);
    }
    if (params?.search && params.search.trim().length > 0) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this.http.get<PaginatedVisaProcessesResponse>(this.baseUrl, {
      params: httpParams
    });
  }

  // Obtener detalle completo de un tramite consular por identificador UUID
  getVisaProcessById(id: string): Observable<VisaProcess> {
    return this.http.get<VisaProcess>(`${this.baseUrl}/${id}`);
  }

  // Registrar nuevo tramite consular con codigo de confirmacion DS-160
  createVisaProcess(dto: CreateVisaProcessDto): Observable<VisaProcess> {
    const payload = {
      bookingId: dto.bookingId,
      passengerId: dto.passengerId,
      confirmationCode: dto.confirmationCode,
      consularFeeAmount: dto.consularFeeAmount ?? 185.0,
      currency: dto.currency ?? 'USD'
    };
    return this.http.post<VisaProcess>(this.baseUrl, payload);
  }

  // Avanzar de fase consular mediante la maquina de transiciones determinista
  updateVisaProcessStatus(
    id: string,
    dto: TransitionVisaDto
  ): Observable<TransitionVisaResponse> {
    return this.http.patch<TransitionVisaResponse>(
      `${this.baseUrl}/${id}/status`,
      dto
    );
  }

  // Programar cita consular y registrar arancel MRV $185 USD de forma atomica
  scheduleAppointment(
    visaProcessId: string,
    dto: ScheduleAppointmentDto
  ): Observable<ScheduleAppointmentResponse> {
    const payload = {
      ...dto,
      consularFeeAmount: dto.consularFeeAmount ?? 185.0
    };
    return this.http.post<ScheduleAppointmentResponse>(
      `${this.baseUrl}/${visaProcessId}/appointments`,
      payload
    );
  }

  // Consultar agenda indexada de citas consulares multianuales a largo plazo
  getMultiannualAppointments(
    query?: MultiannualAppointmentsQuery
  ): Observable<MultiannualAppointmentsResponse> {
    let httpParams = new HttpParams();

    if (query?.year) {
      httpParams = httpParams.set('year', query.year.toString());
    }
    if (query?.startDate) {
      httpParams = httpParams.set('startDate', query.startDate);
    }
    if (query?.endDate) {
      httpParams = httpParams.set('endDate', query.endDate);
    }
    if (query?.customerId) {
      httpParams = httpParams.set('customerId', query.customerId);
    }
    if (query?.customerSearch && query.customerSearch.trim().length > 0) {
      httpParams = httpParams.set('customerSearch', query.customerSearch.trim());
    }
    if (query?.location && query.location.trim().length > 0) {
      httpParams = httpParams.set('location', query.location.trim());
    }
    if (query?.page) {
      httpParams = httpParams.set('page', query.page.toString());
    }
    if (query?.limit) {
      httpParams = httpParams.set('limit', query.limit.toString());
    }

    return this.http.get<MultiannualAppointmentsResponse>(
      `${this.baseUrl}/appointments/multiannual`,
      { params: httpParams }
    );
  }
}
