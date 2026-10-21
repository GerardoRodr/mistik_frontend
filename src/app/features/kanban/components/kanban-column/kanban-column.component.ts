import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kanban-column-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="p-3 rounded-t-lg border border-b-0 flex items-center justify-between transition-colors"
      [ngClass]="getHeaderClasses()"
    >
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" [ngClass]="getDotClass()"></span>
        <h3 class="font-bold text-xs text-slate-900 tracking-tight">
          {{ title() }}
        </h3>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
          [ngClass]="getBadgeClasses()"
        >
          {{ count() }}
        </span>
      </div>

      <!-- Indicador de capacidad operativa -->
      @if (wipLimit()) {
        <div class="flex items-center gap-1.5 text-[10px] font-semibold">
          @if (isOverloaded()) {
            <span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold animate-pulse">
              Capacidad excedida (Máx. {{ wipLimit() }})
            </span>
          } @else {
            <span class="text-slate-400 font-mono">
              Capacidad: {{ count() }}/{{ wipLimit() }}
            </span>
          }
        </div>
      }
    </div>
  `
})
export class KanbanColumnHeaderComponent {
  readonly title = input.required<string>();
  readonly count = input.required<number>();
  readonly wipLimit = input<number | null>(null);
  readonly isOverloaded = input<boolean>(false);
  readonly columnId = input<string>('');

  getHeaderClasses(): string {
    if (this.isOverloaded()) {
      return 'bg-rose-50 border-rose-300';
    }
    return 'bg-slate-100/80 border-slate-200';
  }

  getDotClass(): string {
    switch (this.columnId()) {
      case 'IN_PROGRESS':
        return 'bg-sky-500';
      case 'UNDER_REVIEW':
        return 'bg-purple-500';
      case 'DONE':
        return 'bg-emerald-500';
      case 'BACKLOG':
      default:
        return 'bg-slate-400';
    }
  }

  getBadgeClasses(): string {
    if (this.isOverloaded()) {
      return 'bg-rose-600 text-white';
    }
    return 'bg-white text-slate-700 border border-slate-200';
  }
}
