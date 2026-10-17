// Enums y fases consulares del tramite de visa DS-160
export type VisaStep =
  | 'REGISTRO_DS160'
  | 'PAGO_ARANCEL'
  | 'CITA_CONSOLIDADA'
  | 'CONCLUIDO';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'ATTENDED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type AppointmentLocationType = 'CAS' | 'EMBAJADA' | 'OTRO';

// Representacion de una cita consular individual
export interface VisaAppointment {
  id: string;
  title: string;
  appointmentDate: string;
  location: string;
  status: AppointmentStatus;
  visaProcessId?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Campos normalizados para presentacion
  visaProcess?: {
    id: string;
    confirmationCode: string;
    consularFeePaid: boolean;
    currentStep?: VisaStep;
    casDate?: string | null;
    embassyDate?: string | null;
    booking?: {
      id?: string;
      bookingCode: string;
      customer?: {
        id?: string;
        firstName: string;
        lastName: string;
        documentType?: string;
        documentNumber: string;
      };
    };
  };
}

// Elemento de la linea de tiempo del proceso
export interface VisaTimelineStep {
  step: VisaStep;
  order: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

// Modelo principal de tramite consular de visa
export interface VisaProcess {
  id: string;
  bookingId: string;
  passengerId: string;
  confirmationCode: string;
  consularFeePaid: boolean;
  consularFeeAmount: number | string;
  currency: string;
  currentStep: VisaStep;
  casDate?: string | null;
  embassyDate?: string | null;
  createdAt: string;
  updatedAt: string;
  allowedTransitions?: VisaStep[];
  timeline?: VisaTimelineStep[];
  appointments?: VisaAppointment[];
  booking?: {
    id: string;
    bookingCode: string;
    customerId?: string;
    customer?: {
      id?: string;
      firstName: string;
      lastName: string;
      documentType?: string;
      documentNumber: string;
      email?: string;
      phone?: string;
    };
  };
  passenger?: {
    id: string;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
  };
}

// Carga util para crear nuevo tramite consular
export interface CreateVisaProcessDto {
  bookingId: string;
  passengerId: string;
  confirmationCode: string;
  consularFeeAmount?: number;
  currency?: string;
}

// Carga util para transicion de fase consular en la maquina de estados
export interface TransitionVisaDto {
  targetStep: VisaStep;
  confirmationCode?: string;
  consularFeePaid?: boolean;
  casDate?: string;
  embassyDate?: string;
  notes?: string;
}

// Carga util para registrar cita y comprobante MRV $185 USD
export interface ScheduleAppointmentDto {
  appointmentDate: string;
  location: string;
  title: string;
  mrvPaymentCode?: string;
  consularFeeAmount?: number;
  notes?: string;
}

// Respuesta de programacion de cita
export interface ScheduleAppointmentResponse {
  message: string;
  appointment: VisaAppointment;
  visaProcess: VisaProcess;
}

// Respuesta de transicion de fase
export interface TransitionVisaResponse {
  transition: {
    success: boolean;
    previousStep: VisaStep;
    newStep: VisaStep;
    allowedNextSteps: VisaStep[];
    message: string;
  };
  visaProcess: VisaProcess;
}

// Parametros de consulta para listado general de tramites
export interface VisaQueryParams {
  page?: number;
  limit?: number;
  currentStep?: VisaStep;
  bookingId?: string;
  search?: string;
}

// Respuesta paginada de expedientes de visas
export interface PaginatedVisaProcessesResponse {
  data: VisaProcess[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Parametros de consulta para citas consulares multianuales
export interface MultiannualAppointmentsQuery {
  year?: number;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  customerSearch?: string;
  location?: string;
  page?: number;
  limit?: number;
}

// Respuesta indexada de citas multianuales
export interface MultiannualAppointmentsResponse {
  data: VisaAppointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    range: {
      startDate: string;
      endDate: string;
      year?: number;
    };
  };
}
