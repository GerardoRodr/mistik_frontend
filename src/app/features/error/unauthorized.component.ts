import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center p-4">
      <div class="text-center max-w-md bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
        <div class="w-12 h-12 mx-auto mb-3 rounded-[6px] bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span class="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Acceso Denegado &bull; 403</span>
        <h1 class="text-xl font-bold text-slate-900 mt-1 mb-2">Permisos Insuficientes</h1>
        <p class="text-xs text-slate-500 mb-5 leading-relaxed">
          Su perfil de operador no cuenta con las facultades de seguridad requeridas para acceder a este modulo del sistema.
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
export class UnauthorizedComponent {}
