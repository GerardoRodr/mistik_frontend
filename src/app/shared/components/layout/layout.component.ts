import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NotificationToastComponent } from '../notification-toast/notification-toast.component';
import { AlertsSocketService } from '../../../core/services/alerts-socket.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, NotificationToastComponent],
  templateUrl: './layout.component.html',
  host: {
    class: 'block h-full w-full'
  }
})
export class LayoutComponent implements OnInit {
  private readonly alertsService = inject(AlertsSocketService);

  ngOnInit(): void {
    // Conectar el centro de alertas en tiempo real sobre el namespace /alerts
    this.alertsService.connect();
  }
}
