import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AllowedTransitionsResponse,
  Booking,
  BookingQueryParams,
  CreateBookingDto,
  PaginatedBookingsResponse,
  TransitionBookingDto,
  TransitionBookingResponse
} from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/bookings`;

  // Listar reservas con paginacion y filtros
  getBookings(params?: BookingQueryParams): Observable<PaginatedBookingsResponse> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.serviceType) {
      httpParams = httpParams.set('serviceType', params.serviceType);
    }
    if (params?.customerId) {
      httpParams = httpParams.set('customerId', params.customerId);
    }
    if (params?.search && params.search.trim().length > 0) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this.http.get<PaginatedBookingsResponse>(this.baseUrl, { params: httpParams });
  }

  // Obtener expediente consolidado de reserva por identificador UUID
  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${id}`);
  }

  // Registrar nueva reserva turistica o vuelo
  createBooking(dto: CreateBookingDto): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, dto);
  }

  // Consultar transiciones permitidas segun el estado actual de la reserva
  getAllowedTransitions(id: string): Observable<AllowedTransitionsResponse> {
    return this.http.get<AllowedTransitionsResponse>(`${this.baseUrl}/${id}/transitions`);
  }

  // Ejecutar cambio de estado a traves de la maquina de estados de vuelos
  transitionBooking(id: string, dto: TransitionBookingDto): Observable<TransitionBookingResponse> {
    return this.http.post<TransitionBookingResponse>(`${this.baseUrl}/${id}/transition`, dto);
  }
}
