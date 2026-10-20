// Enums del ciclo de vida y clasificacion de reservas
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ServiceType = 'FLIGHT' | 'VISA' | 'PACKAGE' | 'OTHER';

export type Currency = 'USD' | 'PEN';

// Consolidadora mayorista o aerolinea proveedora de emision
export interface Wholesaler {
  id: string;
  code: string;
  name: string;
  type?: 'WHOLESALER' | 'AIRLINE' | string;
  category?: 'CONSOLIDADORA' | 'AEROLINEA';
  ruc?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
  pnr?: string;
  customerId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  totalAmount: number;
  currency: Currency;
  wholesalerId?: string;
  wholesalerName?: string;
  wholesaler?: Wholesaler;
  origin?: string;
  destination?: string;
  departureDate?: string | null;
  returnDate?: string | null;
  airline?: string;
  flightNumber?: string;
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
  wholesalerId?: string;
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


// Metodos de pago aceptados en caja y bancos
export type PaymentMethod =
  | 'TRANSFERENCIA'
  | 'TARJETA'
  | 'YAPE_PLIN'
  | 'DEPOSITO'
  | 'EFECTIVO';

// Estado formal de liquidacion de una reserva
export type PaymentSettlementStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

// Carga util para registrar un abono financiero con enlace a Google Drive
export interface CreatePaymentDto {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod | string;
  operationNumber: string;
  bankName: string;
  driveReceiptUrl: string;
}

// Registro individual de abono o pago
export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  currency: Currency;
  paymentMethod: string;
  operationNumber: string;
  bankName: string;
  driveReceiptUrl: string;
  paymentDate: string;
  isVerified?: boolean;
}

// Balance y estado de liquidacion de una reserva
export interface BookingBalance {
  bookingId: string;
  bookingCode: string;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  currency: Currency;
  paymentStatus: PaymentSettlementStatus;
  paymentsCount: number;
  payments?: PaymentRecord[];
}

// Respuesta al registrar un pago exitoso
export interface RegisterPaymentResponse {
  payment: PaymentRecord;
  balance: BookingBalance;
}
