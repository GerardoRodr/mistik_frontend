import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, ParsedItinerary, ParsedPassenger } from '../../../../core/services/ai.service';

@Component({
  selector: 'app-itinerary-parser-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itinerary-parser-modal.component.html'
})
export class ItineraryParserModalComponent {
  private readonly aiService = inject(AiService);

  readonly closed = output<void>();
  readonly itineraryImported = output<ParsedItinerary>();

  // Senales de estado
  readonly rawEmailText = signal<string>('');
  readonly isProcessing = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly extractedItinerary = signal<ParsedItinerary | null>(null);

  // Cargar texto de ejemplo de confirmacion de vuelo
  loadSampleText(): void {
    const sample =
      'Estimado cliente, su reserva con LATAM Airlines ha sido confirmada exitosamente.\n' +
      'Localizador PNR: LIM789\n' +
      'Ruta: Trujillo (TRU) hacia Madrid (MAD)\n' +
      'Fecha de salida: 2026-11-20T08:30:00Z\n' +
      'Pasajero: JUAN CARLOS PEREZ GOMEZ, DNI: 74859632\n' +
      'Tarifa total pagada: USD 1250.00';
    this.rawEmailText.set(sample);
  }

  // Ejecutar analisis con Gemini 2.5 Flash
  processItinerary(): void {
    const text = this.rawEmailText().trim();
    if (!text) {
      this.errorMessage.set('Por favor ingresa o pega el texto del correo de la reserva.');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    this.aiService.parseItinerary(text).subscribe({
      next: (result) => {
        this.isProcessing.set(false);
        this.extractedItinerary.set({ ...result });
      },
      error: () => {
        this.isProcessing.set(false);
        this.errorMessage.set(
          'No se pudo extraer el itinerario automáticamente. Verifique el texto o complete manualmente.'
        );
      }
    });
  }

  // Modificar campo extraido
  updateField<K extends keyof ParsedItinerary>(field: K, value: any): void {
    this.extractedItinerary.update((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }

  // Agregar pasajero al itinerario extraido
  addPassenger(): void {
    this.extractedItinerary.update((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        passengers: [...prev.passengers, { fullName: '', documentNumber: '' }]
      };
    });
  }

  // Remover pasajero
  removePassenger(index: number): void {
    this.extractedItinerary.update((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        passengers: prev.passengers.filter((_, i) => i !== index)
      };
    });
  }

  // Confirmar e importar al formulario de reserva
  confirmImport(): void {
    const current = this.extractedItinerary();
    if (current) {
      this.itineraryImported.emit(current);
    }
  }

  // Cerrar modal
  close(): void {
    this.closed.emit();
  }
}
