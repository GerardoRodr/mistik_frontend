import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateTaskDto,
  KanbanColumnType,
  ServiceTask,
  TaskQueryParams,
  TaskStatus
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/tasks`;

  // Mapeo unificado para columnas canonicas
  static normalizeColumn(status: TaskStatus | string): KanbanColumnType {
    const s = (status || '').toUpperCase();
    if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (s === 'UNDER_REVIEW' || s === 'IN_REVIEW') return 'UNDER_REVIEW';
    if (s === 'DONE' || s === 'COMPLETED') return 'DONE';
    return 'BACKLOG'; // PENDING o BACKLOG
  }

  // Listar tareas operativas con filtros (GET /api/v1/tasks)
  getTasks(params?: TaskQueryParams): Observable<ServiceTask[]> {
    let httpParams = new HttpParams();

    if (params?.groupByStatus) {
      httpParams = httpParams.set('groupByStatus', 'true');
    }
    if (params?.priority && params.priority !== 'ALL') {
      httpParams = httpParams.set('priority', params.priority);
    }
    if (params?.assignedToId) {
      httpParams = httpParams.set('assignedToId', params.assignedToId);
    }
    if (params?.bookingId) {
      httpParams = httpParams.set('bookingId', params.bookingId);
    }
    if (params?.search && params.search.trim().length > 0) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<any>(this.baseUrl, { params: httpParams }).pipe(
      map((res) => this.extractTaskList(res))
    );
  }

  // Registrar nueva tarea operativa (POST /api/v1/tasks)
  createTask(dto: CreateTaskDto): Observable<ServiceTask> {
    return this.http.post<any>(this.baseUrl, dto).pipe(
      map((res) => (res.task ? res.task : res))
    );
  }

  // Transicionar estado de tarjeta Kanban (PATCH /api/v1/tasks/:id/status)
  updateStatus(
    id: string,
    targetStatus: TaskStatus,
    notes?: string
  ): Observable<any> {
    const payload = {
      targetStatus,
      notes: notes || `Movimiento de tarjeta a ${targetStatus}`
    };
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, payload);
  }

  // Asignar colaborador responsable exclusivo (PATCH /api/v1/tasks/:id/assign)
  assignTask(id: string, assignedToId: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/assign`, {
      assignedToId
    });
  }

  // Extrae y normaliza la lista de tareas independientemente del formato devuelto
  private extractTaskList(res: any): ServiceTask[] {
    let list: any[] = [];

    if (Array.isArray(res)) {
      list = res;
    } else if (res && Array.isArray(res.data)) {
      list = res.data;
    } else if (res && typeof res === 'object') {
      // Si viene agrupado por columnas { BACKLOG: [...], IN_PROGRESS: [...], ... }
      const groupedKeys = Object.keys(res);
      for (const key of groupedKeys) {
        if (Array.isArray(res[key])) {
          list = list.concat(res[key]);
        }
      }
    }

    return list.map((item) => ({
      ...item,
      status: TasksService.normalizeColumn(item.status || item.kanbanColumn)
    }));
  }
}
