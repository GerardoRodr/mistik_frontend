import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, OcrPassportResult } from '../../../../core/services/ai.service';

@Component({
  selector: 'app-passport-ocr-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './passport-ocr-modal.component.html'
})
export class PassportOcrModalComponent {
  private readonly aiService = inject(AiService);

  readonly closed = output<void>();
  readonly passportImported = output<OcrPassportResult>();

  // Senales reactivas
  readonly imageBase64 = signal<string | null>(null);
  readonly travelDate = signal<string>('');
  readonly isAnalyzing = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly ocrResult = signal<OcrPassportResult | null>(null);
  readonly acknowledgedWarning = signal<boolean>(false);

  // Manejar seleccion de archivo de imagen
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.readFile(input.files[0]);
    }
  }

  // Manejar archivo arrastrado (drag and drop)
  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.readFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // Leer archivo mediante FileReader y generar Base64
  private readFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor seleccione un archivo de imagen válido (JPEG o PNG).');
      return;
    }

    this.errorMessage.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      this.imageBase64.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Cargar imagen de prueba sintetica para demostraciones o tests rapidos
  loadSampleImage(): void {
    // Imagen miniatura transparente valida en Base64
    const sampleBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    this.imageBase64.set(sampleBase64);
  }

  // Ejecutar analisis OCR multimodal con Gemini 2.5 Flash
  analyzePassport(): void {
    const image = this.imageBase64();
    if (!image) {
      this.errorMessage.set('Debe cargar una imagen del pasaporte antes de analizar.');
      return;
    }

    this.isAnalyzing.set(true);
    this.errorMessage.set(null);
    this.acknowledgedWarning.set(false);

    this.aiService.ocrPassport(image, this.travelDate() || undefined).subscribe({
      next: (result) => {
        this.isAnalyzing.set(false);
        this.ocrResult.set(result);
      },
      error: () => {
        this.isAnalyzing.set(false);
        this.errorMessage.set(
          'Ocurrió un error al procesar la imagen del pasaporte. Verifique la calidad de la foto o intente nuevamente.'
        );
      }
    });
  }

  // Confirmar e importar al expediente consular
  confirmImport(): void {
    const result = this.ocrResult();
    if (!result) return;

    if (result.isExpired) {
      alert('No es posible importar un pasaporte vencido al expediente consular.');
      return;
    }

    if (result.isExpiringSoon && !this.acknowledgedWarning()) {
      alert('Debe marcar la confirmación de haber advertido al solicitante sobre la vigencia menor a 6 meses.');
      return;
    }

    this.passportImported.emit(result);
  }

  // Cerrar modal
  close(): void {
    this.closed.emit();
  }
}
