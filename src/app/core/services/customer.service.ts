import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateCustomerDto,
  Customer,
  CustomerBooking,
  CustomerDetail,
  CustomerPassenger,
  CustomerPayment,
  CustomerQueryParams,
  CustomerServiceTask,
  CustomerVisaProcess,
  PaginatedCustomersResponse,
  UpdateCustomerDto
} from '../models/customer.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/customers`;

  // Listar clientes con paginacion y busqueda en tiempo real
  getCustomers(params?: CustomerQueryParams): Observable<PaginatedCustomersResponse> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.search && params.search.trim().length > 0) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this.http.get<PaginatedCustomersResponse>(this.baseUrl, { params: httpParams });
  }

  // Obtener expediente de un cliente por su identificador UUID normalizando relaciones
  getCustomerById(id: string): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(`${this.baseUrl}/${id}`).pipe(
      map((customer) => {
        const rawBookings = customer.bookings || [];
        const normalizedBookings: CustomerBooking[] = rawBookings.map((b: any) => ({
          ...b,
          bookingCode: b.bookingCode || b.code || '',
          code: b.bookingCode || b.code || '',
        }));

        // Aplanar pagos de reservas si no existen en raiz
        const aggregatedPayments: CustomerPayment[] =
          customer.payments && customer.payments.length > 0
            ? customer.payments
            : normalizedBookings.flatMap((b: any) =>
                (b.payments || []).map((pay: any) => ({
                  ...pay,
                  transactionRef: pay.transactionRef || pay.operationNumber || null,
                }))
              );

        // Aplanar procesos de visas de reservas si no existen en raiz
        const aggregatedVisas: CustomerVisaProcess[] =
          customer.visaProcesses && customer.visaProcesses.length > 0
            ? customer.visaProcesses
            : normalizedBookings.flatMap((b: any) =>
                (b.visaProcesses || []).map((v: any) => ({
                  ...v,
                  country: v.country || 'EE.UU.',
                  visaType: v.visaType || 'Turismo B1/B2',
                  status: v.status || v.currentStep || 'EN_PROCESO',
                  appointmentDate: v.appointmentDate || v.embassyDate || v.casDate || null,
                }))
              );

        // Aplanar tareas de reservas si no existen en raiz
        const aggregatedTasks: CustomerServiceTask[] =
          customer.serviceTasks && customer.serviceTasks.length > 0
            ? customer.serviceTasks
            : normalizedBookings.flatMap((b: any) => b.tasks || b.serviceTasks || []);

        // Consolidar pasajeros directos y acompanantes vinculados a reservas
        const directPassengers = customer.passengers || [];
        const bookingPassengers = normalizedBookings.flatMap((b: any) => b.passengers || []);
        const passengerMap = new Map<string, CustomerPassenger>();
        for (const p of [...directPassengers, ...bookingPassengers]) {
          if (p && p.id && !passengerMap.has(p.id)) {
            passengerMap.set(p.id, p);
          }
        }
        const aggregatedPassengers =
          passengerMap.size > 0 ? Array.from(passengerMap.values()) : directPassengers;

        return {
          ...customer,
          bookings: normalizedBookings,
          payments: aggregatedPayments,
          visaProcesses: aggregatedVisas,
          serviceTasks: aggregatedTasks,
          passengers: aggregatedPassengers,
        };
      })
    );
  }

  // Registrar un nuevo cliente en el CRM
  createCustomer(dto: CreateCustomerDto): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, dto);
  }

  // Actualizar parcialmente los datos de un cliente
  updateCustomer(id: string, dto: UpdateCustomerDto): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}`, dto);
  }
}
