import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ParsedPassenger {
  fullName: string;
  documentNumber?: string;
}

export interface ParsedItinerary {
  pnr: string;
  airline: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  returnDate?: string | null;
  passengers: ParsedPassenger[];
  ticketCost: number;
  currency: string;
}

export interface PassportBiographicData {
  passportNumber: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  nationality: string;
  birthDate: string;
  expirationDate: string;
  mrz?: string;
}

export interface PassportValidityAnalysis {
  expirationDate: string;
  referenceDate?: string;
  monthsRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  status: 'VALIDO' | 'CRITICO_VIGENCIA_MENOR_6_MESES' | 'VENCIDO';
  alertMessage: string;
}

export interface OcrPassportResult {
  // Propiedades planas para facil consumo en plantillas y pruebas unitarias
  passportNumber: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  nationality: string;
  birthDate: string;
  expirationDate: string;
  monthsRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  status: 'VALIDO' | 'CRITICO_VIGENCIA_MENOR_6_MESES' | 'VENCIDO';
  alertMessage: string;
  mrz?: string;

  // Propiedades anidadas opcionales para compatibilidad con la respuesta raw del backend
  passport?: PassportBiographicData;
  validity?: PassportValidityAnalysis;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/ai`;

  // Parser NLP de correos de itinerarios aereos (POST /api/v1/ai/parse-itinerary)
  parseItinerary(rawEmailText: string): Observable<ParsedItinerary> {
    return this.http.post<ParsedItinerary>(`${this.baseUrl}/parse-itinerary`, {
      rawEmailText
    });
  }

  // Lector OCR multimodal de pasaportes y evaluador de vigencia (POST /api/v1/ai/ocr-passport)
  ocrPassport(imageBase64: string, travelDate?: string): Observable<OcrPassportResult> {
    return this.http
      .post<any>(`${this.baseUrl}/ocr-passport`, {
        imageBase64,
        travelDate
      })
      .pipe(
        map((response) => this.normalizeOcrResponse(response))
      );
  }

  // Normaliza tanto respuestas anidadas { passport, validity } como respuestas planas
  private normalizeOcrResponse(raw: any): OcrPassportResult {
    const passport = raw.passport || raw;
    const validity = raw.validity || raw;

    const firstName = passport.firstName || '';
    const lastName = passport.lastName || '';
    const computedFullName =
      passport.fullName ||
      (firstName && lastName ? `${firstName} ${lastName}`.trim() : (firstName || lastName || ''));

    const monthsRemaining =
      typeof validity.monthsRemaining === 'number'
        ? validity.monthsRemaining
        : typeof raw.monthsRemaining === 'number'
          ? raw.monthsRemaining
          : 0;

    const isExpiringSoon =
      validity.isExpiringSoon !== undefined
        ? Boolean(validity.isExpiringSoon)
        : Boolean(raw.isExpiringSoon || (monthsRemaining > 0 && monthsRemaining < 6));

    const isExpired =
      validity.isExpired !== undefined
        ? Boolean(validity.isExpired)
        : Boolean(raw.isExpired || monthsRemaining <= 0);

    let status: 'VALIDO' | 'CRITICO_VIGENCIA_MENOR_6_MESES' | 'VENCIDO' =
      validity.status || raw.status;

    if (!status) {
      if (isExpired) {
        status = 'VENCIDO';
      } else if (isExpiringSoon) {
        status = 'CRITICO_VIGENCIA_MENOR_6_MESES';
      } else {
        status = 'VALIDO';
      }
    }

    const alertMessage =
      validity.alertMessage ||
      raw.alertMessage ||
      (status === 'CRITICO_VIGENCIA_MENOR_6_MESES'
        ? 'Alerta preventiva: El pasaporte cuenta con vigencia menor a 6 meses para la fecha del trámite o viaje.'
        : status === 'VENCIDO'
          ? 'El pasaporte se encuentra vencido para la fecha del viaje o trámite.'
          : 'Pasaporte con vigencia conforme para trámites consulares y viajes.');

    return {
      passportNumber: passport.passportNumber || raw.passportNumber || '',
      fullName: computedFullName,
      firstName,
      lastName,
      nationality: passport.nationality || raw.nationality || '',
      birthDate: passport.birthDate || raw.birthDate || '',
      expirationDate: passport.expirationDate || validity.expirationDate || raw.expirationDate || '',
      monthsRemaining,
      isExpiringSoon,
      isExpired,
      status,
      alertMessage,
      mrz: passport.mrz || raw.mrz || '',
      passport: {
        passportNumber: passport.passportNumber || raw.passportNumber || '',
        firstName,
        lastName,
        fullName: computedFullName,
        nationality: passport.nationality || raw.nationality || '',
        birthDate: passport.birthDate || raw.birthDate || '',
        expirationDate: passport.expirationDate || raw.expirationDate || '',
        mrz: passport.mrz || raw.mrz || ''
      },
      validity: {
        expirationDate: validity.expirationDate || passport.expirationDate || '',
        referenceDate: validity.referenceDate,
        monthsRemaining,
        isExpiringSoon,
        isExpired,
        status,
        alertMessage
      }
    };
  }
}
