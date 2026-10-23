// Tipos de estado y columnas del flujo operativo Kanban
export type TaskStatus =
  | 'BACKLOG'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'IN_REVIEW'
  | 'DONE'
  | 'COMPLETED'
  | 'CANCELLED';

export type KanbanColumnType =
  | 'BACKLOG'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Informacion del colaborador responsable asignado
export interface Assignee {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Modelo principal de tarea operativa en el tablero
export interface ServiceTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  kanbanColumn?: string;
  priority: TaskPriority;
  dueDate?: string;
  assignedToId?: string | null;
  assignedTo?: Assignee | null;
  bookingId?: string;
  booking?: {
    id: string;
    bookingCode?: string;
    code?: string;
    pnr?: string;
  };
  visaProcessId?: string;
  movedAt?: string;
  completedAt?: string | null;
  createdAt: string;
  allowedNextColumns?: string[];
}

// DTO para crear una nueva tarea operativa
export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  bookingId?: string;
  assignedToId?: string;
}

// Parametros de consulta y filtrado de tareas
export interface TaskQueryParams {
  groupByStatus?: boolean;
  priority?: TaskPriority | string;
  assignedToId?: string;
  bookingId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
