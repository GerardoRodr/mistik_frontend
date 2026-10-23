# Guia Tecnica de Implementacion Frontend: Semana 10 (mistik-frontend)

**Proyecto:** Single Page Application (SPA) - MISTIK TOURS & TRAVEL S.A.C.  
**Corte Academico:** Semana 10 (Hito de Desarrollo - 100% Funcionalidad del Software)  
**Stack Tecnologico:** Angular v22, TypeScript, Standalone Components, Signals, Tailwind CSS, Angular CDK Drag & Drop (`@angular/cdk`), Socket.io Client (`socket.io-client`), Chart.js, Vitest.

---

## 1. Vision General del Alcance Frontend en Semana 10

En la Semana 10 se completa la capa cliente del sistema web en `mistik-frontend`, conectando la totalidad de interfaces graficas y flujos reactivos con los microservicios y endpoints desarrollados en `mistik_api`:

| Codigo WBS | Entregable / Paquete de Trabajo | Modulo / Caracteristica Frontend | Archivos Clave a Crear o Modificar |
| :---: | :--- | :--- | :--- |
| **8.1.1.1** - **8.1.2.2** | Tablero Operativo Kanban con Drag & Drop y Asignacion Exclusiva | `features/kanban/` (Nuevo) | `kanban-board.component.ts`, `task-card.component.ts`, `services/tasks.service.ts` |
| **9.1.2.2** - **9.1.2.3** | Notificaciones Toast y Centro de Alertas en Tiempo Real | `core/services/` y `shared/components/` | `alerts-socket.service.ts`, `notification-toast.component.ts` |
| **10.1.1.1** - **10.1.1.3** | Modal de Extraccion NLP de Itinerarios con IA | `features/bookings/components/` | `itinerary-parser-modal.component.ts`, `services/ai.service.ts` |
| **10.1.2.1** - **10.1.2.3** | Modal OCR de Pasaportes y Alerta de Vigencia Menor a 6 Meses | `features/visas/components/` | `passport-ocr-modal.component.ts`, `services/ai.service.ts` |
| **11.1.1.1** - **11.1.1.3** | Formulario de Pagos con Enlace Drive y Calculador de Saldos | `features/bookings/components/` | `payment-form-modal.component.ts`, `balance-summary.component.ts` |
| **11.1.2.1** - **11.1.2.3** | Dashboards de BI Financiero, Cuellos de Botella y Conversion | `features/analytics/` (Nuevo) | `analytics-dashboard.component.ts`, `services/analytics.service.ts` |

---

## 2. Dependencias Requeridas en `mistik-frontend`

Antes de la implementacion grafica, deben instalarse las librerias especificas de arrastre, WebSockets y graficacion:

```bash
npm install @angular/cdk socket.io-client chart.js
```

---

## 3. Componente 8: Tablero Operativo Kanban (WBS 8.1.1.1 - 8.1.2.2)

### 3.1 Estructura del Modulo `features/kanban/`
```text
src/app/features/kanban/
├── components/
│   ├── kanban-board/
│   │   ├── kanban-board.component.ts
│   │   ├── kanban-board.component.html
│   │   └── kanban-board.component.css
│   ├── kanban-column/
│   │   └── kanban-column.component.ts
│   └── task-card/
│       └── task-card.component.ts
├── models/
│   └── task.model.ts
└── services/
    └── tasks.service.ts
```

### 3.2 Modelos e Interfaces (`models/task.model.ts`)
```typescript
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Assignee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ServiceTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedToId?: string;
  assignedTo?: Assignee;
  bookingId?: string;
  visaProcessId?: string;
  completedAt?: string;
  createdAt: string;
}
```

### 3.3 Logica de `KanbanBoardComponent` con Angular CDK y Signals
- **WIP Limits:** Limite estricto visual de 3 tarjetas en `IN_PROGRESS` y 2 tarjetas en `UNDER_REVIEW`. Si la columna excede el limite, el encabezado se pinta en rojo con alerta de sobrecarga.
- **Asignacion Exclusiva (`8.1.2.2`):** Cada tarjeta permite seleccionar un responsable unico mediante un `<select>` reactivo o modal rapido. Al mover una tarjeta de `BACKLOG` a `IN_PROGRESS`, el sistema valida que tenga un colaborador asignado; de lo contrario, cancela la transicion y solicita asignarlo.
- **Eventos CDK Drag & Drop:**
  ```typescript
  import { Component, OnInit, signal, computed, inject } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
  import { TasksService } from '../../services/tasks.service';
  import { ServiceTask, TaskStatus } from '../../models/task.model';

  @Component({
    selector: 'app-kanban-board',
    standalone: true,
    imports: [CommonModule, DragDropModule],
    templateUrl: './kanban-board.component.html',
  })
  export class KanbanBoardComponent implements OnInit {
    private tasksService = inject(TasksService);

    tasks = signal<ServiceTask[]>([]);
    selectedPriority = signal<string>('ALL');
    searchTerm = signal<string>('');

    // Columnas computadas con Signals
    backlogTasks = computed(() => this.filterTasks('BACKLOG'));
    inProgressTasks = computed(() => this.filterTasks('IN_PROGRESS'));
    underReviewTasks = computed(() => this.filterTasks('UNDER_REVIEW'));
    doneTasks = computed(() => this.filterTasks('DONE'));

    ngOnInit() {
      this.loadTasks();
    }

    loadTasks() {
      this.tasksService.getTasks().subscribe(tasks => this.tasks.set(tasks));
    }

    private filterTasks(status: TaskStatus): ServiceTask[] {
      return this.tasks().filter(t => {
        const matchesStatus = t.status === status;
        const matchesPriority = this.selectedPriority() === 'ALL' || t.priority === this.selectedPriority();
        const matchesSearch = !this.searchTerm() || t.title.toLowerCase().includes(this.searchTerm().toLowerCase());
        return matchesStatus && matchesPriority && matchesSearch;
      });
    }

    onDrop(event: CdkDragDrop<ServiceTask[]>, targetStatus: TaskStatus) {
      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        const movedTask = event.previousContainer.data[event.previousIndex];

        // Validacion de asignacion obligatoria para avanzar
        if (targetStatus === 'IN_PROGRESS' && !movedTask.assignedToId) {
          alert('Debe asignar un responsable antes de mover la tarea a Progreso');
          return;
        }

        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );

        this.tasksService.updateStatus(movedTask.id, targetStatus).subscribe({
          error: () => this.loadTasks() // Revertir en caso de fallo
        });
      }
    }
  }
  ```

---

## 4. Componente 9: Alertas en Tiempo Real y WebSockets (WBS 9.1.2.2, 9.1.2.3)

### 4.1 Servicio WebSocket: `core/services/alerts-socket.service.ts`
- Conecta con el namespace `/alerts` expuesto por NestJS.
- Mantiene una coleccion reactiva de alertas activas mediante `signal`.

```typescript
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

@Injectable({ providedIn: 'root' })
export class AlertsSocketService {
  private socket: Socket | null = null;
  alerts = signal<AlertNotification[]>([]);
  unreadCount = signal<number>(0);

  connect() {
    this.socket = io(`${environment.apiUrl}/alerts`, {
      transports: ['websocket'],
    });

    this.socket.on('alert:checkin-due', (payload: any) => {
      this.addAlert({
        id: crypto.randomUUID(),
        type: 'CHECKIN_DUE',
        title: 'Check-in Proximo Requerido',
        message: `Vuelo ${payload.pnr} para ${payload.passengerName} requiere emision en menos de 48h`,
        timestamp: new Date(),
        referenceId: payload.bookingId,
        read: false,
      });
    });

    this.socket.on('alert:visa-appointment', (payload: any) => {
      this.addAlert({
        id: crypto.randomUUID(),
        type: 'VISA_APPOINTMENT',
        title: 'Cita Consular Proxima',
        message: `Cliente ${payload.customerName} tiene cita consular en ${payload.daysRemaining} dias`,
        timestamp: new Date(),
        referenceId: payload.visaId,
        read: false,
      });
    });
  }

  private addAlert(alert: AlertNotification) {
    this.alerts.update(prev => [alert, ...prev]);
    this.unreadCount.update(count => count + 1);
  }

  markAsRead(id: string) {
    this.alerts.update(alerts =>
      alerts.map(a => (a.id === id ? { ...a, read: true } : a))
    );
    this.unreadCount.update(c => Math.max(0, c - 1));
  }
}
```

### 4.2 Componente Toast Flotante: `shared/components/notification-toast/`
- Componente no invasivo anclado en la esquina superior derecha del Layout.
- Muestra los mensajes de check-in y citas consulares entrantes con animacion suave y autodestruccion tras 8 segundos.

---

## 5. Componente 10: Asistentes de Inteligencia Artificial (WBS 10.1.1.1 - 10.1.2.3)

### 5.1 Servicio Frontend: `core/services/ai.service.ts`
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ParsedItinerary {
  pnr: string;
  airline: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  returnDate?: string;
  passengers: Array<{ fullName: string; documentNumber?: string }>;
  ticketCost: number;
  currency: string;
}

export interface OcrPassportResult {
  passportNumber: string;
  fullName: string;
  nationality: string;
  birthDate: string;
  expirationDate: string;
  monthsRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  status: 'VALIDO' | 'CRITICO_VIGENCIA_MENOR_6_MESES' | 'VENCIDO';
  alertMessage: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/ai`;

  parseItinerary(rawEmailText: string): Observable<ParsedItinerary> {
    return this.http.post<ParsedItinerary>(`${this.baseUrl}/parse-itinerary`, { rawEmailText });
  }

  ocrPassport(imageBase64: string, travelDate?: string): Observable<OcrPassportResult> {
    return this.http.post<OcrPassportResult>(`${this.baseUrl}/ocr-passport`, { imageBase64, travelDate });
  }
}
```

### 5.2 Modal de Extraccion NLP de Itinerarios (`itinerary-parser-modal.component.ts`)
- Campo de texto amplio (Textarea) donde el usuario copia y pega el correo enviado por la aerolinea o mayorista.
- Boton interactivo de procesamiento con spinner de carga.
- Formulario de previsualizacion editable con los campos extraidos: PNR, Aerolinea, Origen, Destino, Pasajeros y Monto.
- Boton "Confirmar e Importar a Reserva" que autocompleta el formulario principal de creacion de reserva.

### 5.3 Modal de OCR de Pasaportes y Alerta de Vigencia (`passport-ocr-modal.component.ts`)
- Zona de arrastre de imagenes (Drag & Drop) para cargar fotos o escaneos de pasaportes.
- Previsualizacion de la imagen y barra de progreso.
- Indicador visual de vigencia:
  - **Verde:** Pasaporte con mas de 6 meses de vigencia.
  - **Rojo Intenso con Alerta:** Pasaporte con vigencia menor a 6 meses (`isExpiringSoon = true`). Muestra el mensaje: *"Alerta preventiva: El pasaporte cuenta con vigencia menor a 6 meses para la fecha del tramite consular"*.
  - Bloqueo o confirmacion condicionada de registro de expediente consular.

---

## 6. Componente 11: Finanzas y Dashboards de BI (WBS 11.1.1.1 - 11.1.2.3)

### 6.1 Formulario de Pagos y Calculador de Saldos Deudores (`features/bookings/`)
- **`payment-form-modal.component.ts`:**
  - Registro de pagos con campos: Monto, Moneda (`USD` / `PEN`), Metodo de pago, Numero de operacion, Banco emisor.
  - Campo `driveReceiptUrl` con validacion estricta mediante regex de enlace a Google Drive (`https://drive.google.com/...`).
- **`balance-summary.component.ts`:**
  - Muestra en tiempo real:
    - Costo Total del Servicio
    - Total Pagado Acumulado
    - Saldo Pendiente (en rojo si es mayor a 0, en verde si el estado es `PAID`)
    - Historial de comprobantes con enlace directo para abrir el recibo en Google Drive.

### 6.2 Modulo de Analitica y Dashboards (`features/analytics/`)
- **`analytics-dashboard.component.ts`:**
  - Implementa graficos interactivos mediante `Chart.js`:
    1. **Grafico de Rendimiento Financiero:** Comparativa de Ingresos Devengados vs Cobrados vs Saldos por Cobrar.
    2. **Embudo de Conversion Consular:** Grafico de barras que refleja el progreso de postulantes en cada fase (Registro inicial -> DS-160 -> Cita CAS -> Entrevista -> Visa Aprobada).
    3. **Indicador de Cuellos de Botella Kanban:** Grafico de dispersion o barras que muestra el tiempo promedio de permanencia por columna y el ratio de cumplimiento de limites WIP.

---

## 7. Bateria de Pruebas Unitarias Frontend (Vitest)

Pruebas automatizadas requeridas para garantizar la estabilidad de los componentes:
1. `src/app/features/kanban/kanban-board.component.spec.ts`: Validar que no se permita arrastrar a `IN_PROGRESS` si no hay colaborador asignado.
2. `src/app/core/services/alerts-socket.service.spec.ts`: Validar el incremento reactivo de notificaciones ante eventos WebSockets simulados.
3. `src/app/features/bookings/components/itinerary-parser-modal.component.spec.ts`: Validar la presentacion y edicion de los datos extraidos por IA.
4. `src/app/features/visas/components/passport-ocr-modal.component.spec.ts`: Validar la activacion del badge de alerta critica cuando la vigencia es menor a 6 meses.
5. `src/app/features/bookings/components/balance-summary.component.spec.ts`: Validar el calculo correcto del saldo deudor y visualizacion del enlace a Google Drive.
6. `src/app/features/analytics/analytics-dashboard.component.spec.ts`: Validar el renderizado correcto de graficos ante respuestas del servicio de analitica.
