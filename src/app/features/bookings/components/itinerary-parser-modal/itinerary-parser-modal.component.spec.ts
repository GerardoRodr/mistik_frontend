import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItineraryParserModalComponent } from './itinerary-parser-modal.component';
import { AiService, ParsedItinerary } from '../../../../core/services/ai.service';

describe('ItineraryParserModalComponent', () => {
  let component: ItineraryParserModalComponent;
  let fixture: ComponentFixture<ItineraryParserModalComponent>;
  let aiService: AiService;

  const mockParsedItinerary: ParsedItinerary = {
    pnr: 'LIM789',
    airline: 'LATAM Airlines',
    departureCity: 'Trujillo',
    arrivalCity: 'Madrid',
    departureDate: '2026-11-20T08:30:00Z',
    returnDate: null,
    passengers: [
      { fullName: 'JUAN CARLOS PEREZ GOMEZ', documentNumber: '74859632' }
    ],
    ticketCost: 1250,
    currency: 'USD'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItineraryParserModalComponent],
      providers: [
        AiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    aiService = TestBed.inject(AiService);
    fixture = TestBed.createComponent(ItineraryParserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.extractedItinerary()).toBeNull();
  });

  it('debe cargar texto de ejemplo al invocar loadSampleText', () => {
    component.loadSampleText();
    expect(component.rawEmailText()).toContain('LATAM Airlines');
    expect(component.rawEmailText()).toContain('LIM789');
  });

  it('debe procesar el texto con AiService y presentar los datos extraídos', () => {
    vi.spyOn(aiService, 'parseItinerary').mockReturnValue(of(mockParsedItinerary));

    component.rawEmailText.set('Texto de correo confirmando vuelo LIM789');
    component.processItinerary();

    expect(aiService.parseItinerary).toHaveBeenCalledWith('Texto de correo confirmando vuelo LIM789');
    expect(component.extractedItinerary()?.pnr).toBe('LIM789');
    expect(component.extractedItinerary()?.airline).toBe('LATAM Airlines');
    expect(component.extractedItinerary()?.ticketCost).toBe(1250);
    expect(component.extractedItinerary()?.passengers.length).toBe(1);
  });

  it('debe permitir editar campos y emitir el resultado al confirmar importacion', () => {
    component.extractedItinerary.set({ ...mockParsedItinerary });

    let emittedResult: ParsedItinerary | null = null;
    component.itineraryImported.subscribe((res: ParsedItinerary) => {
      emittedResult = res;
    });

    component.updateField('pnr', 'LIM999');
    component.confirmImport();

    expect(emittedResult).not.toBeNull();
    const res = emittedResult as ParsedItinerary | null;
    expect(res?.pnr).toBe('LIM999');
  });
});
