import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AlertsSocketService, AlertNotification } from '../../../core/services/alerts-socket.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notification-toast.component.html'
})
export class NotificationToastComponent {
  protected readonly alertsService = inject(AlertsSocketService);

  // Cerrar toast flotante manualmente
  dismiss(id: string): void {
    this.alertsService.dismissToast(id);
  }

  // Estilo visual del toast segun el tipo de alerta
  getToastClasses(alert: AlertNotification): { border: string; bg: string; iconBg: string; text: string } {
    switch (alert.type) {
      case 'CHECKIN_DUE':
        return {
          border: 'border-amber-300',
          bg: 'bg-white',
          iconBg: 'bg-amber-100 text-amber-700',
          text: 'text-amber-900'
        };
      case 'VISA_APPOINTMENT':
        return {
          border: 'border-[#E11D48]/30',
          bg: 'bg-white',
          iconBg: 'bg-rose-100 text-[#E11D48]',
          text: 'text-slate-900'
        };
      case 'TASK_UPDATE':
      default:
        return {
          border: 'border-emerald-300',
          bg: 'bg-white',
          iconBg: 'bg-emerald-100 text-emerald-700',
          text: 'text-emerald-950'
        };
    }
  }
}
