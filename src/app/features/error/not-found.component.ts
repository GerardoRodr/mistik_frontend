import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center p-4">
      <div class="text-center max-w-md bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
        <div class="w-12 h-12 mx-auto mb-3 rounded-[6px] bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recurso Inexistente &bull; 404</span>
        <h1 class="text-xl font-bold text-slate-900 mt-1 mb-2">Modulo No Localizado</h1>
        <p class="text-xs text-slate-500 mb-5 leading-relaxed">
          El endpoint o recurso solicitado no esta registrado en el mapa de rutas del sistema ERP.
        </p>
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] bg-[#E11D48] hover:bg-[#BE123C] text-white font-semibold text-xs transition shadow-xs"
        >
          <span>Retornar al Panel Principal</span>
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
