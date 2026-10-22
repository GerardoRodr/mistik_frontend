import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlertsSocketService, AlertNotification } from './alerts-socket.service';

describe('AlertsSocketService', () => {
  let service: AlertsSocketService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [AlertsSocketService]
    });
    service = TestBed.inject(AlertsSocketService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe crearse correctamente con valores iniciales limpios', () => {
    expect(service).toBeTruthy();
    expect(service.alerts().length).toBe(0);
    expect(service.activeToasts().length).toBe(0);
    expect(service.unreadCount()).toBe(0);
  });

  it('debe agregar una alerta reactivamente e incrementar el contador de no leidas', () => {
    const alert: AlertNotification = {
      id: 'alert-1',
      type: 'CHECKIN_DUE',
      title: 'Check-in Próximo',
      message: 'Vuelo LIM123 requiere check-in en menos de 48h',
      timestamp: new Date(),
      read: false
    };

    service.addAlert(alert);

    expect(service.alerts().length).toBe(1);
    expect(service.activeToasts().length).toBe(1);
    expect(service.unreadCount()).toBe(1);
    expect(service.alerts()[0].title).toBe('Check-in Próximo');
  });

  it('debe autodestruir el toast flotante tras 8 segundos conservando el historial', () => {
    const alert: AlertNotification = {
      id: 'alert-toast-1',
      type: 'VISA_APPOINTMENT',
      title: 'Cita Consular',
      message: 'Cita en 15 días',
      timestamp: new Date(),
      read: false
    };

    service.addAlert(alert);
    expect(service.activeToasts().length).toBe(1);
    expect(service.alerts().length).toBe(1);

    // Avanzar reloj 8000 ms (8 segundos)
    vi.advanceTimersByTime(8000);

    expect(service.activeToasts().length).toBe(0); // Removido de toasts
    expect(service.alerts().length).toBe(1); // Conservado en historial
  });

  it('debe marcar una notificacion individual como leida y decrementar unreadCount', () => {
    service.pushAlert({ id: 'alert-1', title: 'Alerta 1' });
    service.pushAlert({ id: 'alert-2', title: 'Alerta 2' });

    expect(service.unreadCount()).toBe(2);

    service.markAsRead('alert-1');

    expect(service.unreadCount()).toBe(1);
    const marked = service.alerts().find((a) => a.id === 'alert-1');
    expect(marked?.read).toBe(true);
  });

  it('debe marcar todas las notificaciones como leidas con markAllAsRead', () => {
    service.pushAlert({ id: 'alert-1', title: 'Alerta 1' });
    service.pushAlert({ id: 'alert-2', title: 'Alerta 2' });

    expect(service.unreadCount()).toBe(2);

    service.markAllAsRead();

    expect(service.unreadCount()).toBe(0);
    expect(service.alerts().every((a) => a.read)).toBe(true);
  });
});
