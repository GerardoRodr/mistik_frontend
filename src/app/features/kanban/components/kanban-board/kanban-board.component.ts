import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { TasksService } from '../../services/tasks.service';
import {
  Assignee,
  CreateTaskDto,
  ServiceTask,
  TaskPriority,
  TaskStatus
} from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';
import { KanbanColumnHeaderComponent } from '../kanban-column/kanban-column.component';
import { AlertsSocketService } from '../../../../core/services/alerts-socket.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TaskCardComponent,
    KanbanColumnHeaderComponent
  ],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly alertsService = inject(AlertsSocketService);
  private readonly authService = inject(AuthService);

  // Senales reactivas del tablero
  readonly tasks = signal<ServiceTask[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Filtros reactivos
  readonly selectedPriority = signal<string>('ALL');
  readonly selectedAssigneeId = signal<string>('ALL');
  readonly searchTerm = signal<string>('');

  // Control de modal de creacion de tarea
  readonly showCreateModal = signal<boolean>(false);
  readonly newTaskTitle = signal<string>('');
  readonly newTaskDescription = signal<string>('');
  readonly newTaskPriority = signal<TaskPriority>('MEDIUM');
  readonly newTaskDueDate = signal<string>('');
  readonly newTaskAssignedToId = signal<string>('');
  readonly isCreatingTask = signal<boolean>(false);

  // Columnas computadas con Signals
  readonly backlogTasks = computed(() => this.filterTasks('BACKLOG'));
  readonly inProgressTasks = computed(() => this.filterTasks('IN_PROGRESS'));
  readonly underReviewTasks = computed(() => this.filterTasks('UNDER_REVIEW'));
  readonly doneTasks = computed(() => this.filterTasks('DONE'));

  // Evaluacion de limites de capacidad operativa sugerida
  readonly isInProgressOverloaded = computed(
    () => this.inProgressTasks().length > 3
  );
  readonly isUnderReviewOverloaded = computed(
    () => this.underReviewTasks().length > 2
  );

  // Metricas computadas
  readonly totalTasksCount = computed(() => this.tasks().length);
  readonly activeTasksCount = computed(
    () =>
      this.tasks().filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED')
        .length
  );

  // Lista consolidada de colaboradores para selector
  readonly assigneesList = computed<Assignee[]>(() => {
    const map = new Map<string, Assignee>();

    // Usuario activo actual
    const current = this.authService.currentUser();
    if (current) {
      map.set(current.id, {
        id: current.id,
        name: current.name,
        email: current.email,
        role: current.role
      });
    }

    // Colaboradores que ya tienen tareas
    for (const t of this.tasks()) {
      if (t.assignedTo && t.assignedTo.id) {
        map.set(t.assignedTo.id, t.assignedTo);
      }
    }

    // Colaboradores de respaldo si estuvieran vacios
    if (map.size === 0) {
      map.set('user-admin', {
        id: 'user-admin',
        name: 'Administrador Mistik',
        email: 'admin@mistiktours.com',
        role: 'ADMIN'
      });
      map.set('user-supervisor', {
        id: 'user-supervisor',
        name: 'Supervisor Operaciones',
        email: 'supervisor@mistiktours.com',
        role: 'SUPERVISOR'
      });
      map.set('user-asesor', {
        id: 'user-asesor',
        name: 'Carlos Asesor',
        email: 'carlos@mistik.com',
        role: 'AGENT'
      });
    }

    return Array.from(map.values());
  });

  constructor() {
    // Escuchar actualizaciones de estado emitidas por WebSockets
    effect(() => {
      const socketEvent = this.alertsService.lastTaskStatusChange();
      if (socketEvent) {
        this.handleExternalTaskStatusChange(socketEvent);
      }
    });
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  // Cargar tareas operativas desde el backend
  loadTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tasksService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(
          'No se pudo conectar con el servidor para obtener las tareas operativas.'
        );
      }
    });
  }

  // Filtrado reactivo de tareas segun columna y filtros superiores
  private filterTasks(status: TaskStatus): ServiceTask[] {
    const list = this.tasks();
    const priority = this.selectedPriority();
    const assignee = this.selectedAssigneeId();
    const term = this.searchTerm().trim().toLowerCase();

    return list.filter((t) => {
      const matchStatus = t.status === status;
      const matchPriority = priority === 'ALL' || t.priority === priority;
      const matchAssignee = assignee === 'ALL' || t.assignedToId === assignee;
      const matchTerm =
        !term ||
        t.title.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.booking?.bookingCode &&
          t.booking.bookingCode.toLowerCase().includes(term)) ||
        (t.booking?.pnr && t.booking.pnr.toLowerCase().includes(term));

      return matchStatus && matchPriority && matchAssignee && matchTerm;
    });
  }

  // Manejador de evento Angular CDK Drag and Drop
  onDrop(event: CdkDragDrop<ServiceTask[]>, targetStatus: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const movedTask = event.previousContainer.data[event.previousIndex];
      if (!movedTask) return;

      // Invariante estricta: No se permite mover a 'IN_PROGRESS' sin responsable asignado
      if (targetStatus === 'IN_PROGRESS' && !movedTask.assignedToId) {
        const msg =
          'Es necesario asignar un colaborador responsable antes de pasar la tarea a En Progreso.';
        this.errorMessage.set(msg);
        alert(msg);
        return;
      }

      this.errorMessage.set(null);

      // Transferencia visual inmediata en el contenedor
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Actualizar el estado en el arreglo global de senales
      this.tasks.update((currentTasks) =>
        currentTasks.map((t) =>
          t.id === movedTask.id ? { ...t, status: targetStatus } : t
        )
      );

      // Persistir transicion en el backend
      this.tasksService.updateStatus(movedTask.id, targetStatus).subscribe({
        next: () => {
          this.showTimedSuccess(`Tarea actualizada a ${this.getStatusLabel(targetStatus)}.`);
        },
        error: () => {
          this.errorMessage.set(
            'Error al actualizar el estado de la tarea en el servidor. Se restablecerá la vista.'
          );
          this.loadTasks(); // Revertir en caso de fallo
        }
      });
    }
  }

  // Asignar colaborador a una tarea
  onAssignTask(event: { taskId: string; assignedToId: string }): void {
    const assignee = this.assigneesList().find((a) => a.id === event.assignedToId);

    // Actualizacion optimista
    this.tasks.update((current) =>
      current.map((t) =>
        t.id === event.taskId
          ? {
              ...t,
              assignedToId: event.assignedToId,
              assignedTo: assignee || t.assignedTo
            }
          : t
      )
    );

    this.tasksService.assignTask(event.taskId, event.assignedToId).subscribe({
      next: () => {
        this.showTimedSuccess(
          `Colaborador ${assignee?.name || ''} asignado correctamente.`
        );
      },
      error: () => {
        this.errorMessage.set('Error al asignar el responsable en el servidor.');
        this.loadTasks();
      }
    });
  }

  // Movimiento rapido solicitado desde la tarjeta
  onMoveRequested(event: { taskId: string; targetStatus: TaskStatus }): void {
    const task = this.tasks().find((t) => t.id === event.taskId);
    if (!task) return;

    if (event.targetStatus === 'IN_PROGRESS' && !task.assignedToId) {
      const msg =
        'Es necesario asignar un colaborador responsable antes de pasar la tarea a En Progreso.';
      this.errorMessage.set(msg);
      alert(msg);
      return;
    }

    this.tasks.update((current) =>
      current.map((t) =>
        t.id === event.taskId ? { ...t, status: event.targetStatus } : t
      )
    );

    this.tasksService.updateStatus(event.taskId, event.targetStatus).subscribe({
      next: () => {
        this.showTimedSuccess(
          `Tarea trasladada a ${this.getStatusLabel(event.targetStatus)}.`
        );
      },
      error: () => {
        this.errorMessage.set('No se pudo completar el traslado de la tarea.');
        this.loadTasks();
      }
    });
  }

  // Sincronizar en tiempo real ante eventos WebSockets recibidos
  private handleExternalTaskStatusChange(event: any): void {
    if (!event || !event.taskId) return;
    const targetStatus = TasksService.normalizeColumn(
      event.targetColumn || event.targetStatus
    );

    this.tasks.update((current) =>
      current.map((t) => {
        if (t.id === event.taskId) {
          return {
            ...t,
            status: targetStatus,
            assignedTo: event.assignedTo || t.assignedTo
          };
        }
        return t;
      })
    );
  }

  // Abrir modal de creacion de tarea
  openCreateModal(): void {
    this.newTaskTitle.set('');
    this.newTaskDescription.set('');
    this.newTaskPriority.set('MEDIUM');
    this.newTaskDueDate.set('');
    this.newTaskAssignedToId.set('');
    this.showCreateModal.set(true);
  }

  // Cerrar modal de creacion
  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  // Registrar nueva tarea
  submitNewTask(): void {
    if (!this.newTaskTitle().trim()) {
      alert('Por favor ingrese el título de la tarea.');
      return;
    }

    this.isCreatingTask.set(true);
    const dto: CreateTaskDto = {
      title: this.newTaskTitle().trim(),
      description: this.newTaskDescription().trim() || undefined,
      priority: this.newTaskPriority(),
      dueDate: this.newTaskDueDate() || undefined,
      assignedToId: this.newTaskAssignedToId() || undefined
    };

    this.tasksService.createTask(dto).subscribe({
      next: (created) => {
        this.isCreatingTask.set(false);
        this.showCreateModal.set(false);
        this.tasks.update((prev) => [created, ...prev]);
        this.showTimedSuccess(`Tarea "${created.title}" registrada exitosamente.`);
      },
      error: () => {
        this.isCreatingTask.set(false);
        alert('Ocurrió un error al registrar la tarea en el servidor.');
      }
    });
  }

  // Feedback temporal de exito
  private showTimedSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4000);
  }

  // Etiqueta legible de estado en español
  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'UNDER_REVIEW':
      case 'IN_REVIEW':
        return 'En Revisión';
      case 'DONE':
      case 'COMPLETED':
        return 'Completado';
      case 'BACKLOG':
      case 'PENDING':
      default:
        return 'Por Iniciar';
    }
  }
}
