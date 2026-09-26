// Modelo principal de cliente CRM
export interface Customer {
  id: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Entidad de reserva vinculada al expediente
export interface CustomerBooking {
  id: string;
  code: string;
  serviceType: string;
  status: string;
  totalAmount: number;
  currency: string;
  travelDate?: string | null;
  returnDate?: string | null;
  notes?: string | null;
  createdAt?: string;
}

// Entidad de pasajero vinculada al expediente
export interface CustomerPassenger {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate?: string | null;
  nationality?: string | null;
}

// Entidad de pago vinculada al expediente
export interface CustomerPayment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef?: string | null;
  status: string;
  paidAt: string;
}

// Entidad de tarea de servicio vinculada al expediente
export interface CustomerServiceTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  createdAt?: string;
}

// Entidad de tramite consular de visa vinculada al expediente
export interface CustomerVisaProcess {
  id: string;
  country: string;
  visaType: string;
  status: string;
  appointmentDate?: string | null;
  submissionDate?: string | null;
  resolutionDate?: string | null;
  notes?: string | null;
}

// Expediente consolidado 360 grados del cliente
export interface CustomerDetail extends Customer {
  bookings?: CustomerBooking[];
  passengers?: CustomerPassenger[];
  payments?: CustomerPayment[];
  serviceTasks?: CustomerServiceTask[];
  visaProcesses?: CustomerVisaProcess[];
}

// Metadatos de paginacion devueltos por el backend
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Respuesta paginada del listado de clientes
export interface PaginatedCustomersResponse {
  data: Customer[];
  meta: PaginationMeta;
}

// Carga util para registrar un nuevo cliente
export interface CreateCustomerDto {
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

// Carga util para actualizacion parcial de cliente
export interface UpdateCustomerDto {
  documentType?: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

// Parametros de consulta para listado y busqueda
export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
