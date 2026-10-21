import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KanbanBoardComponent } from './kanban-board.component';
import { TasksService } from '../../services/tasks.service';
import { ServiceTask } from '../../models/task.model';
import { AuthService } from '../../../../core/services/auth.service';

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let tasksService: TasksService;

  const mockTasks: ServiceTask[] = [
    {
      id: 'task-1',
      title: 'Emisión de boletos LATAM',
      status: 'BACKLOG',
      priority: 'HIGH',
      createdAt: '2026-10-23T10:00:00Z',
      assignedToId: null,
      assignedTo: null
    },
    {
      id: 'task-2',
      title: 'Validación de DS-160',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      createdAt: '2026-10-23T11:00:00Z',
      assignedToId: 'user-1',
      assignedTo: { id: 'user-1', name: 'Carlos Asesor', email: 'carlos@mistik.com', role: 'AGENT' }
    },
    {
      id: 'task-3',
      title: 'Revisión arancel MRV',
      status: 'UNDER_REVIEW',
      priority: 'MEDIUM',
      createdAt: '2026-10-23T12:00:00Z',
      assignedToId: 'user-2',
      assignedTo: { id: 'user-2', name: 'Supervisor Operaciones', email: 'sup@mistik.com', role: 'SUPERVISOR' }
    },
    {
      id: 'task-4',
      title: 'Confirmación de hotel',
      status: 'DONE',
      priority: 'LOW',
      createdAt: '2026-10-23T13:00:00Z',
      assignedToId: 'user-1',
      assignedTo: { id: 'user-1', name: 'Carlos Asesor', email: 'carlos@mistik.com', role: 'AGENT' }
    }
  ];

  beforeEach(async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
      providers: [
        TasksService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    tasksService = TestBed.inject(TasksService);
    vi.spyOn(tasksService, 'getTasks').mockReturnValue(of(mockTasks));

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializarse y cargar tareas en las 4 columnas del tablero', () => {
    expect(component).toBeTruthy();
    expect(component.tasks().length).toBe(4);
    expect(component.backlogTasks().length).toBe(1);
    expect(component.inProgressTasks().length).toBe(1);
    expect(component.underReviewTasks().length).toBe(1);
    expect(component.doneTasks().length).toBe(1);
  });

  it('debe detectar sobrecarga cuando se superan los límites de capacidad sugerida', () => {
    // Limite IN_PROGRESS es 3
    expect(component.isInProgressOverloaded()).toBe(false);

    // Agregar 3 tareas mas a IN_PROGRESS (total 4)
    const extraTask: ServiceTask = {
      id: 'extra-1',
      title: 'Tarea extra',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdAt: '2026-10-23T14:00:00Z',
      assignedToId: 'user-1'
    };

    component.tasks.update((prev) => [...prev, extraTask, { ...extraTask, id: 'extra-2' }, { ...extraTask, id: 'extra-3' }]);
    expect(component.isInProgressOverloaded()).toBe(true);
  });

  it('debe bloquear el movimiento a En Progreso si la tarea no tiene colaborador asignado', () => {
    const updateSpy = vi.spyOn(tasksService, 'updateStatus');
    const taskWithoutAssignee = mockTasks[0]; // status: BACKLOG, assignedToId: null

    const mockDropEvent = {
      previousIndex: 0,
      currentIndex: 0,
      previousContainer: { data: [taskWithoutAssignee] },
      container: { data: [] }
    } as any;

    component.onDrop(mockDropEvent, 'IN_PROGRESS');

    expect(window.alert).toHaveBeenCalledWith(
      'Es necesario asignar un colaborador responsable antes de pasar la tarea a En Progreso.'
    );
    expect(updateSpy).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('asignar un colaborador responsable');
  });

  it('debe permitir la transicion a En Progreso si la tarea cuenta con colaborador asignado', () => {
    const updateSpy = vi.spyOn(tasksService, 'updateStatus').mockReturnValue(of({ success: true }));
    const taskWithAssignee: ServiceTask = {
      ...mockTasks[0],
      assignedToId: 'user-1',
      assignedTo: { id: 'user-1', name: 'Carlos Asesor', email: 'carlos@mistik.com', role: 'AGENT' }
    };

    const mockDropEvent = {
      previousIndex: 0,
      currentIndex: 0,
      previousContainer: { data: [taskWithAssignee] },
      container: { data: [] }
    } as any;

    component.onDrop(mockDropEvent, 'IN_PROGRESS');

    expect(updateSpy).toHaveBeenCalledWith(taskWithAssignee.id, 'IN_PROGRESS');
  });

  it('debe asignar un colaborador cuando se emite el evento onAssignTask', () => {
    const assignSpy = vi.spyOn(tasksService, 'assignTask').mockReturnValue(of({ success: true }));

    component.onAssignTask({ taskId: 'task-1', assignedToId: 'user-1' });

    expect(assignSpy).toHaveBeenCalledWith('task-1', 'user-1');
    const updated = component.tasks().find((t) => t.id === 'task-1');
    expect(updated?.assignedToId).toBe('user-1');
  });
});
