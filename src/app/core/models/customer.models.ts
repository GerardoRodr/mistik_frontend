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
