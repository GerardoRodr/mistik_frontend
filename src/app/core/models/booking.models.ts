// Enums del ciclo de vida y clasificacion de reservas
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ServiceType = 'FLIGHT' | 'VISA' | 'PACKAGE' | 'OTHER';

export type Currency = 'USD' | 'PEN';

// Pasajero asociado a la reserva
export interface BookingPassenger {
  id?: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  pnr?: string;
  ticketNumber?: string;
}

// Modelo principal de reserva turistica
export interface Booking {
  id: string;
  bookingCode: string;
  code?: string;
  customerId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  totalAmount: number;
  currency: Currency;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
  };
  passengers?: BookingPassenger[];
  allowedTransitions?: BookingStatus[];
}

// Carga util para registrar nueva reserva
export interface CreateBookingDto {
  customerId: string;
  serviceType: ServiceType;
  totalAmount: number;
  currency?: Currency;
  pnr?: string;
  notes?: string;
  passengers?: BookingPassenger[];
}

// Carga util para ejecutar transicion de estado en maquina de estados
export interface TransitionBookingDto {
  targetStatus: BookingStatus;
  pnr?: string;
  ticketNumber?: string;
  cancellationReason?: string;
  notes?: string;
}

// Respuesta de consulta de transiciones validas
export interface AllowedTransitionsResponse {
  bookingId: string;
  currentStatus: BookingStatus;
  allowedTransitions: BookingStatus[];
}

// Respuesta de ejecucion de transicion de estado
export interface TransitionBookingResponse {
  transition: {
    success: boolean;
    previousStatus: BookingStatus;
    newStatus: BookingStatus;
    allowedNextStates: BookingStatus[];
    message: string;
  };
  booking: Booking;
}

// Parametros de consulta y filtrado de reservas
export interface BookingQueryParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  serviceType?: ServiceType;
  customerId?: string;
  search?: string;
}

// Respuesta paginada de reservas
export interface PaginatedBookingsResponse {
  data: Booking[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
