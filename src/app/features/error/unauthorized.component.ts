import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center p-4">
      <div class="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Error 403 - Forbidden</span>
        <h1 class="text-2xl font-black text-slate-900 mt-1 mb-2">Acceso No Autorizado</h1>
        <p class="text-xs text-slate-500 mb-6 leading-relaxed">
          Su rol actual no cuenta con los permisos necesarios para acceder a este recurso del sistema.
        </p>
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition"
        >
          <span>Regresar al Panel Principal</span>
        </a>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {}
