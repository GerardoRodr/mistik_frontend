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
  TransitionBookingResponse,
  Wholesaler
} from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/bookings`;

  // Catalogo de consolidadoras mayoristas y aerolineas autorizadas
  private readonly wholesalersCatalog: Wholesaler[] = [
    {
      id: 'wh-costamar',
      code: 'COSTAMAR',
      name: 'Costamar Travel',
      category: 'CONSOLIDADORA',
      description: 'Consolidador mayorista internacional lider en Peru',
      contactPhone: '+51 1 616-9000'
    },
    {
      id: 'wh-agil',
      code: 'AGIL',
      name: 'Agil Operador Mayorista',
      category: 'CONSOLIDADORA',
      description: 'Emisiones de vuelos y servicios corporativos',
      contactPhone: '+51 1 610-7777'
    },
    {
      id: 'wh-euroamerican',
      code: 'EUROAMERICAN',
      name: 'Euroamerican Assistance & Tours',
      category: 'CONSOLIDADORA',
      description: 'Operador mayorista de rutas hacia Europa y Norteamerica',
      contactPhone: '+51 1 200-5000'
    },
    {
      id: 'wh-ctm',
      code: 'CTM',
      name: 'CTM Tours',
      category: 'CONSOLIDADORA',
      description: 'GDS Sabre y Amadeus mayorista para agencias',
      contactPhone: '+51 1 615-8000'
    },
    {
      id: 'wh-latam',
      code: 'LATAM',
      name: 'LATAM Airlines Group',
      category: 'AEROLINEA',
      description: 'Alianza y rutas troncales directas en Sudamerica',
      contactPhone: '+51 1 213-8200'
    },
    {
      id: 'wh-copa',
      code: 'COPA',
      name: 'Copa Airlines',
      category: 'AEROLINEA',
      description: 'Hub de las Americas y conexiones globales',
      contactPhone: '+51 1 610-0808'
    },
    {
      id: 'wh-avianca',
      code: 'AVIANCA',
      name: 'Avianca',
      category: 'AEROLINEA',
      description: 'Conectividad andina y Centroamerica',
      contactPhone: '+51 1 511-8222'
    }
  ];

  // Obtener catalogo de consolidadoras mayoristas
  getWholesalers(): Wholesaler[] {
    return [...this.wholesalersCatalog];
  }

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
