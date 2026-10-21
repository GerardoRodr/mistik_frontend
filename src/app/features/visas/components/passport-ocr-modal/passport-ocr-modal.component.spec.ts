import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PassportOcrModalComponent } from './passport-ocr-modal.component';
import { AiService, OcrPassportResult } from '../../../../core/services/ai.service';

describe('PassportOcrModalComponent', () => {
  let component: PassportOcrModalComponent;
  let fixture: ComponentFixture<PassportOcrModalComponent>;
  let aiService: AiService;

  const validPassport: OcrPassportResult = {
    passportNumber: '11223344',
    fullName: 'MARIA ELENA SANCHEZ',
    nationality: 'PERUANA',
    birthDate: '1992-05-14',
    expirationDate: '2029-10-10',
    status: 'VALIDO',
    alertMessage: 'Pasaporte con vigencia optima',
    isExpiringSoon: false,
    isExpired: false,
    monthsRemaining: 36
  };

  const expiringSoonPassport: OcrPassportResult = {
    ...validPassport,
    expirationDate: '2026-12-01',
    status: 'CRITICO_VIGENCIA_MENOR_6_MESES',
    alertMessage: 'Advertencia: vigencia menor a 6 meses',
    isExpiringSoon: true,
    isExpired: false,
    monthsRemaining: 2
  };

  const expiredPassport: OcrPassportResult = {
    ...validPassport,
    expirationDate: '2024-01-01',
    status: 'VENCIDO',
    alertMessage: 'Pasaporte vencido',
    isExpiringSoon: false,
    isExpired: true,
    monthsRemaining: 0
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassportOcrModalComponent],
      providers: [
        AiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    aiService = TestBed.inject(AiService);
    fixture = TestBed.createComponent(PassportOcrModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con estado inicial vacio', () => {
    expect(component).toBeTruthy();
    expect(component.imageBase64()).toBeNull();
    expect(component.ocrResult()).toBeNull();
    expect(component.isAnalyzing()).toBe(false);
  });

  it('debe cargar imagen de ejemplo al llamar loadSampleImage', () => {
    component.loadSampleImage();
    expect(component.imageBase64()).toBeTruthy();
    expect(component.imageBase64()).toContain('data:image/png;base64');
  });

  it('debe procesar la imagen con AiService y almacenar el resultado ocr', () => {
    vi.spyOn(aiService, 'ocrPassport').mockReturnValue(of(validPassport));

    component.loadSampleImage();
    component.travelDate.set('2026-11-15');
    component.analyzePassport();

    expect(aiService.ocrPassport).toHaveBeenCalledWith(component.imageBase64(), '2026-11-15');
    expect(component.ocrResult()?.passportNumber).toBe('11223344');
    expect(component.ocrResult()?.status).toBe('VALIDO');
    expect(component.ocrResult()?.monthsRemaining).toBe(36);
  });

  it('debe bloquear importacion si el pasaporte esta por vencer y no se ha marcado el checkbox de advertencia', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    let emitted = false;
    component.passportImported.subscribe(() => {
      emitted = true;
    });

    component.ocrResult.set(expiringSoonPassport);
    component.acknowledgedWarning.set(false);

    component.confirmImport();

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('vigencia menor a 6 meses')
    );
    expect(emitted).toBe(false);
  });

  it('debe permitir importacion si el pasaporte esta por vencer pero el operador marco el checkbox', () => {
    let emittedResult: OcrPassportResult | null = null;
    component.passportImported.subscribe((res) => {
      emittedResult = res;
    });

    component.ocrResult.set(expiringSoonPassport);
    component.acknowledgedWarning.set(true);

    component.confirmImport();

    expect(emittedResult).not.toBeNull();
    const res = emittedResult as OcrPassportResult | null;
    expect(res?.passportNumber).toBe('11223344');
  });

  it('debe bloquear terminantemente la importacion de un pasaporte vencido', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    let emitted = false;
    component.passportImported.subscribe(() => {
      emitted = true;
    });

    component.ocrResult.set(expiredPassport);
    component.confirmImport();

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('No es posible importar un pasaporte vencido')
    );
    expect(emitted).toBe(false);
  });

  it('debe emitir closed al invocar close', () => {
    let closed = false;
    component.closed.subscribe(() => {
      closed = true;
    });

    component.close();
    expect(closed).toBe(true);
  });
});
