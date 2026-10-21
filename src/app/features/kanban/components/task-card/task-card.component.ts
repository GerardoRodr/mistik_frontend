import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Assignee, ServiceTask, TaskPriority, TaskStatus } from '../../models/task.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div
      class="bg-white rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition p-3.5 space-y-2.5 text-xs text-slate-700 select-none group"
      [class.border-l-4]="true"
      [ngClass]="getPriorityBorderClass(task().priority)"
    >
      <!-- Cabecera de la tarjeta: Prioridad y Referencia -->
      <div class="flex items-center justify-between gap-2">
        <span
          class="px-2 py-0.5 rounded text-[10px] font-bold border"
          [ngClass]="getPriorityBadgeClass(task().priority)"
        >
          {{ getPriorityLabel(task().priority) }}
        </span>

        @if (task().booking?.bookingCode || task().booking?.pnr) {
          <span class="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {{ task().booking?.bookingCode || task().booking?.pnr }}
          </span>
        }
      </div>

      <!-- Titulo y descripcion de la actividad -->
      <div>
        <h4 class="font-bold text-slate-900 text-xs leading-snug group-hover:text-[#E11D48] transition">
          {{ task().title }}
        </h4>
        @if (task().description) {
          <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {{ task().description }}
          </p>
        }
      </div>

      <!-- Asignacion de Colaborador Responsable -->
      <div class="pt-2 border-t border-slate-100 space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Responsable:</span>
          @if (!task().assignedToId) {
            <button
              type="button"
              (click)="assignToCurrentUser($event)"
              class="text-[10px] font-bold text-[#E11D48] hover:text-[#BE123C] hover:underline cursor-pointer"
              title="Asignarme esta tarea a mí"
            >
              Asignarme a mí
            </button>
          }
        </div>

        <!-- Selector o chip del colaborador -->
        <div class="flex items-center gap-1.5">
          <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
            {{ assigneeInitials() }}
          </div>

          <select
            [ngModel]="task().assignedToId || ''"
            (ngModelChange)="onAssigneeSelect($event)"
            (click)="$event.stopPropagation()"
            class="w-full h-7 px-1.5 py-0.5 text-[11px] rounded border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 font-medium focus:ring-1 focus:ring-[#E11D48] focus:bg-white transition"
          >
            <option value="" disabled>-- Sin asignar --</option>
            @for (person of availableAssignees(); track person.id) {
              <option [value]="person.id">{{ person.name }} ({{ person.role }})</option>
            }
          </select>
        </div>
      </div>

      <!-- Pie de tarjeta: Vencimiento y Botones de Movimiento Rapido -->
      <div class="flex items-center justify-between pt-1 text-[10px] text-slate-500">
        <!-- Fecha limite -->
        @if (task().dueDate) {
          <div class="flex items-center gap-1 font-mono" [class.text-rose-600]="isOverdue()" [class.font-bold]="isOverdue()">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ task().dueDate | date:'dd/MM/yyyy' }}</span>
          </div>
        } @else {
          <span class="italic text-slate-400">Sin fecha límite</span>
        }

        <!-- Movimientos rapidos de columna -->
        <div class="flex items-center gap-1">
          @if (task().status === 'BACKLOG') {
            <button
              type="button"
              (click)="requestMove('IN_PROGRESS', $event)"
              class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold transition cursor-pointer"
              title="Iniciar tarea"
            >
              Iniciar &rarr;
            </button>
          } @else if (task().status === 'IN_PROGRESS') {
            <button
              type="button"
              (click)="requestMove('UNDER_REVIEW', $event)"
              class="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-semibold transition cursor-pointer"
              title="Pasar a revisión"
            >
              Revisar &rarr;
            </button>
          } @else if (task().status === 'UNDER_REVIEW') {
            <button
              type="button"
              (click)="requestMove('DONE', $event)"
              class="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold transition cursor-pointer"
              title="Aprobar y completar"
            >
              Completar &check;
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class TaskCardComponent {
  private readonly authService = inject(AuthService);

  readonly task = input.required<ServiceTask>();
  readonly assignees = input<Assignee[]>([]);

  readonly assigned = output<{ taskId: string; assignedToId: string }>();
  readonly moveRequested = output<{ taskId: string; targetStatus: TaskStatus }>();

  // Lista de colaboradores disponibles incluyendo el usuario activo
  readonly availableAssignees = computed(() => {
    const list = [...this.assignees()];
    const currentUser = this.authService.currentUser();
    if (currentUser && !list.some((a) => a.id === currentUser.id)) {
      list.unshift({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      });
    }
    // Si la tarea tiene un asignado que no esta en la lista, incluirlo
    const taskAssignee = this.task().assignedTo;
    if (taskAssignee && !list.some((a) => a.id === taskAssignee.id)) {
      list.push(taskAssignee);
    }
    return list;
  });

  // Iniciales del colaborador asignado
  readonly assigneeInitials = computed(() => {
    const a = this.task().assignedTo;
    if (!a?.name) return '??';
    const parts = a.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return a.name.slice(0, 2).toUpperCase();
  });

  // Determinar si la tarea esta atrasada
  isOverdue(): boolean {
    const due = this.task().dueDate;
    if (!due || this.task().status === 'DONE') return false;
    return new Date(due).getTime() < Date.now();
  }

  // Asignar al usuario actualmente conectado
  assignToCurrentUser(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.authService.currentUser();
    if (current) {
      this.assigned.emit({ taskId: this.task().id, assignedToId: current.id });
    }
  }

  // Manejar cambio en el select
  onAssigneeSelect(assignedToId: string): void {
    if (assignedToId && assignedToId !== this.task().assignedToId) {
      this.assigned.emit({ taskId: this.task().id, assignedToId });
    }
  }

  // Solicitar movimiento de columna
  requestMove(targetStatus: TaskStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.moveRequested.emit({ taskId: this.task().id, targetStatus });
  }

  // Clases semanticas para la barra lateral segun prioridad
  getPriorityBorderClass(priority: TaskPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'border-l-rose-500';
      case 'HIGH':
        return 'border-l-amber-500';
      case 'MEDIUM':
        return 'border-l-sky-500';
      case 'LOW':
      default:
        return 'border-l-slate-400';
    }
  }

  // Estilo de badge segun prioridad
  getPriorityBadgeClass(priority: TaskPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  // Etiqueta formal en español
  getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'Urgente';
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
      default:
        return 'Baja';
    }
  }
}
