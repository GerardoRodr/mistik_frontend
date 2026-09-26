import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center p-4">
      <div class="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Error 404 - Not Found</span>
        <h1 class="text-2xl font-black text-slate-900 mt-1 mb-2">Pagina No Encontrada</h1>
        <p class="text-xs text-slate-500 mb-6 leading-relaxed">
          La ruta que intenta consultar no existe o ha sido movida a otro directorio.
        </p>
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition"
        >
          <span>Regresar al Inicio</span>
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
