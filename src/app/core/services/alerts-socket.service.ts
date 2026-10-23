import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface AlertNotification {
  id: string;
  type: 'CHECKIN_DUE' | 'VISA_APPOINTMENT' | 'TASK_UPDATE';
  title: string;
  message: string;
  timestamp: Date;
  referenceId?: string;
  read: boolean;
}

export interface TaskStatusChangedEvent {
  taskId: string;
  taskTitle: string;
  previousColumn?: string;
  targetColumn?: string;
  previousStatus?: string;
  targetStatus: string;
  movedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  bookingCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertsSocketService {
  private socket: Socket | null = null;

  // Senales reactivas del centro de alertas
  readonly alerts = signal<AlertNotification[]>([]);
  readonly activeToasts = signal<AlertNotification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isConnected = signal<boolean>(false);
  readonly lastTaskStatusChange = signal<TaskStatusChangedEvent | null>(null);

  // Iniciar conexion con el namespace /alerts
  connect(): void {
    if (this.socket) {
      return;
    }

    try {
      this.socket = io(`${environment.apiUrl}/alerts`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });

      this.socket.on('connect', () => {
        this.isConnected.set(true);
      });

      this.socket.on('disconnect', () => {
        this.isConnected.set(false);
      });

      // Evento de recordatorio de check-in de vuelos proximos (24h a 48h)
      this.socket.on('alert:checkin-due', (payload: any) => {
        const pnr = payload.pnr || 'S/N';
        const passenger = payload.passengerName || 'Pasajero titular';
        this.addAlert({
          id: crypto.randomUUID(),
          type: 'CHECKIN_DUE',
          title: 'Check-in Próximo Requerido',
          message: `Vuelo con localizador ${pnr} para ${passenger} requiere emisión de pases en menos de 48 horas.`,
          timestamp: new Date(),
          referenceId: payload.bookingId || payload.taskId,
          read: false
        });
      });

      // Evento de recordatorio de citas consulares (30, 15 y 7 dias)
      this.socket.on('alert:visa-appointment', (payload: any) => {
        const client = payload.applicantName || payload.customerName || 'Postulante';
        const days = payload.daysRemaining !== undefined ? payload.daysRemaining : 'pocos';
        const location = payload.location ? ` en ${payload.location}` : '';
        this.addAlert({
          id: crypto.randomUUID(),
          type: 'VISA_APPOINTMENT',
          title: 'Cita Consular Próxima',
          message: `El solicitante ${client} tiene su cita consular programada en ${days} días${location}.`,
          timestamp: new Date(),
          referenceId: payload.visaId || payload.appointmentId,
          read: false
        });
      });

      // Evento de movimiento o actualizacion de tarjetas en el tablero Kanban
      this.socket.on('task:status-changed', (payload: TaskStatusChangedEvent) => {
        this.lastTaskStatusChange.set(payload);
        const title = payload.taskTitle || 'Tarea operativa';
        const target = payload.targetColumn || payload.targetStatus || 'nueva columna';
        this.addAlert({
          id: crypto.randomUUID(),
          type: 'TASK_UPDATE',
          title: 'Actualización en Tablero Operativo',
          message: `La tarea "${title}" se trasladó a ${target}.`,
          timestamp: new Date(),
          referenceId: payload.taskId,
          read: false
        });
      });
    } catch {
      // Manejo silencioso de error de conexion local
    }
  }

  // Cerrar sesion de socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }

  // Agregar alerta a la coleccion y activar toast flotante con autodestruccion tras 8s
  addAlert(alert: AlertNotification): void {
    this.alerts.update((prev) => [alert, ...prev]);
    this.activeToasts.update((prev) => [alert, ...prev]);
    this.unreadCount.update((count) => count + 1);

    // Autodestruccion del toast flotante tras 8 segundos (8000 ms)
    setTimeout(() => {
      this.dismissToast(alert.id);
    }, 8000);
  }

  // Descartar toast flotante sin eliminar de la bandeja historica
  dismissToast(id: string): void {
    this.activeToasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  // Marcar notificacion especifica como leida
  markAsRead(id: string): void {
    let wasUnread = false;
    this.alerts.update((alerts) =>
      alerts.map((a) => {
        if (a.id === id && !a.read) {
          wasUnread = true;
          return { ...a, read: true };
        }
        return a;
      })
    );
    if (wasUnread) {
      this.unreadCount.update((c) => Math.max(0, c - 1));
    }
  }

  // Marcar todas las notificaciones como leidas
  markAllAsRead(): void {
    this.alerts.update((alerts) => alerts.map((a) => ({ ...a, read: true })));
    this.unreadCount.set(0);
  }

  // Metodo de prueba o emision directa interna
  pushAlert(alert: Partial<AlertNotification>): void {
    this.addAlert({
      id: alert.id || crypto.randomUUID(),
      type: alert.type || 'TASK_UPDATE',
      title: alert.title || 'Notificación del Sistema',
      message: alert.message || 'Se ha registrado una nueva actividad en el sistema.',
      timestamp: alert.timestamp || new Date(),
      referenceId: alert.referenceId,
      read: alert.read || false
    });
  }
}
