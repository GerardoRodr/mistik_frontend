import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { CustomerService } from '../../../core/services/customer.service';
import {
  Booking,
  CreateBookingDto,
  Currency,
  ServiceType,
  Wholesaler
} from '../../../core/models/booking.models';
import { Customer } from '../../../core/models/customer.models';

@Component({
  selector: 'app-booking-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-create.component.html'
})
export class BookingCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  // Entradas y salidas del componente
  readonly preselectedCustomerId = input<string | null | undefined>(null);
  readonly isModal = input<boolean>(false);
  readonly saved = output<Booking>();
  readonly cancelled = output<void>();

  // Senales reactivas de estado
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Senales de clientes y busqueda reactiva
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly customerSearchTerm = signal<string>('');
  readonly customerSearchResults = signal<Customer[]>([]);
  readonly isSearchingCustomers = signal<boolean>(false);

  // Senales de catalogo de consolidadoras mayoristas
  readonly wholesalers = signal<Wholesaler[]>([]);
  readonly wholesalerFilter = signal<string>('');
  readonly selectedWholesaler = signal<Wholesaler | null>(null);

  // Filtrado reactivo de consolidadoras
  readonly filteredWholesalers = computed(() => {
    const filter = this.wholesalerFilter().trim().toLowerCase();
    const list = this.wholesalers();
    if (!filter) return list;
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(filter) ||
        w.code.toLowerCase().includes(filter) ||
        (w.type && w.type.toLowerCase().includes(filter)) ||
        (w.category && w.category.toLowerCase().includes(filter))
    );
  });

  // Formulario reactivo con validacion estricta de PNR (6 caracteres alfanumericos)
  readonly form = this.fb.group({
    customerId: ['', [Validators.required]],
    pnr: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[A-Za-z0-9]{6}$/)
      ]
    ],
    serviceType: ['FLIGHT' as ServiceType, [Validators.required]],
    totalAmount: [
      650,
      [Validators.required, Validators.min(0.01)]
    ],
    currency: ['USD' as Currency, [Validators.required]],
    wholesalerId: ['', [Validators.required]],
    origin: ['TRU', [Validators.required, Validators.minLength(3)]],
    destination: ['LIM', [Validators.required, Validators.minLength(3)]],
    departureDate: ['', [Validators.required]],
    returnDate: [''],
    airline: [''],
    flightNumber: [''],
    notes: [''],
    passengers: this.fb.array([])
  });

  constructor() {
    // Escuchar cliente preseleccionado si viene por parametro de entrada
    effect(() => {
      const custId = this.preselectedCustomerId();
      if (custId) {
        this.form.patchValue({ customerId: custId });
        this.loadCustomerById(custId);
      }
    });
  }

  ngOnInit(): void {
    // Cargar catalogo de consolidadoras mayoristas de forma asincrona
    this.bookingService.getWholesalers().subscribe({
      next: (data) => this.wholesalers.set(data),
      error: () => this.wholesalers.set([])
    });

    // Agregar al menos un pasajero inicial en el FormArray
    if (this.passengersArray.length === 0) {
      this.addPassenger();
    }
  }

  // Getter de conveniencia para FormArray de pasajeros
  get passengersArray(): FormArray {
    return this.form.get('passengers') as FormArray;
  }

  // Agregar nuevo pasajero al formulario
  addPassenger(): void {
    const passengerGroup = this.fb.group({
      documentType: ['DNI', [Validators.required]],
      documentNumber: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      pnr: [''],
      ticketNumber: ['']
    });

    this.passengersArray.push(passengerGroup);
  }

  // Eliminar pasajero del formulario (manteniendo al menos uno)
  removePassenger(index: number): void {
    if (this.passengersArray.length > 1) {
      this.passengersArray.removeAt(index);
    }
  }

  // Conversion automatica a mayusculas en tiempo real para el codigo PNR
  onPnrInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upperValue = (input.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.value = upperValue;
    this.form.get('pnr')?.setValue(upperValue, { emitEvent: false });
  }

  // Busqueda reactiva de clientes por termino de entrada
  onCustomerSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value || '';
    this.customerSearchTerm.set(term);

    if (term.trim().length >= 2) {
      this.isSearchingCustomers.set(true);
      this.customerService.getCustomers({ search: term.trim(), limit: 5 }).subscribe({
        next: (res) => {
          this.customerSearchResults.set(res.data);
          this.isSearchingCustomers.set(false);
        },
        error: () => {
          this.customerSearchResults.set([]);
          this.isSearchingCustomers.set(false);
        }
      });
    } else {
      this.customerSearchResults.set([]);
    }
  }

  // Seleccionar cliente desde la lista de resultados
  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.form.patchValue({ customerId: customer.id });
    this.customerSearchResults.set([]);
    this.customerSearchTerm.set(`${customer.firstName} ${customer.lastName}`);

    // Si el primer pasajero esta vacio, autocompletar con los datos del titular
    if (this.passengersArray.length > 0) {
      const first = this.passengersArray.at(0) as FormGroup;
      if (!first.get('firstName')?.value && !first.get('lastName')?.value) {
        first.patchValue({
          documentType: customer.documentType,
          documentNumber: customer.documentNumber,
          firstName: customer.firstName,
          lastName: customer.lastName
        });
      }
    }
  }

  // Cargar cliente titular directo por UUID
  private loadCustomerById(id: string): void {
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.selectedCustomer.set(customer);
        this.customerSearchTerm.set(`${customer.firstName} ${customer.lastName}`);
        if (this.passengersArray.length > 0) {
          const first = this.passengersArray.at(0) as FormGroup;
          if (!first.get('firstName')?.value) {
            first.patchValue({
              documentType: customer.documentType,
              documentNumber: customer.documentNumber,
              firstName: customer.firstName,
              lastName: customer.lastName
            });
          }
        }
      }
    });
  }

  // Seleccionar consolidadora mayorista del catalogo
  selectWholesaler(wholesaler: Wholesaler): void {
    this.selectedWholesaler.set(wholesaler);
    const isAirline = wholesaler.type === 'AIRLINE' || wholesaler.category === 'AEROLINEA';
    this.form.patchValue({
      wholesalerId: wholesaler.id,
      airline: isAirline ? wholesaler.name : this.form.get('airline')?.value
    });
    this.wholesalerFilter.set(wholesaler.name);
  }

  // Empaquetar datos de itinerario en campo notes estructurado
  private formatNotesWithItinerary(formVal: any, wholesalerName?: string): string | undefined {
    const segments: string[] = [];
    if (formVal.origin && formVal.destination) {
      segments.push(`Ruta: ${formVal.origin.trim().toUpperCase()} -> ${formVal.destination.trim().toUpperCase()}`);
    }
    if (formVal.departureDate) {
      segments.push(`Salida: ${formVal.departureDate}`);
    }
    if (formVal.returnDate) {
      segments.push(`Retorno: ${formVal.returnDate}`);
    }
    const airline = formVal.airline || wholesalerName;
    if (airline) {
      segments.push(`Aerolinea: ${airline.trim()}`);
    }
    if (formVal.flightNumber) {
      segments.push(`Vuelo: ${formVal.flightNumber.trim()}`);
    }

    const itinerarySummary = segments.join(' | ');
    const userNotes = formVal.notes?.trim();

    if (itinerarySummary && userNotes) {
      return `${itinerarySummary}. Observaciones: ${userNotes}`;
    }
    return itinerarySummary || userNotes || undefined;
  }

  // Enviar formulario y crear reserva en backend
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Por favor completa todos los campos requeridos y verifica el formato PNR.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formVal = this.form.getRawValue();
    const wholesaler = this.selectedWholesaler();
    const wholesalerName = wholesaler ? wholesaler.name : undefined;
    const formattedNotes = this.formatNotesWithItinerary(formVal, wholesalerName);

    const payload: CreateBookingDto = {
      customerId: formVal.customerId!,
      serviceType: formVal.serviceType as ServiceType,
      totalAmount: Number(formVal.totalAmount),
      currency: formVal.currency as Currency,
      pnr: formVal.pnr!.toUpperCase(),
      wholesalerId: formVal.wholesalerId || undefined,
      notes: formattedNotes,
      passengers: formVal.passengers?.map((p: any) => ({
        documentType: p.documentType,
        documentNumber: p.documentNumber,
        firstName: p.firstName,
        lastName: p.lastName,
        pnr: p.pnr || formVal.pnr!.toUpperCase(),
        ticketNumber: p.ticketNumber || undefined
      }))
    };

    this.bookingService.createBooking(payload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.saved.emit(created);
        if (!this.isModal()) {
          this.router.navigate(['/reservas']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message;
        if (Array.isArray(msg)) {
          this.errorMessage.set(msg.join('. '));
        } else if (typeof msg === 'string') {
          this.errorMessage.set(msg);
        } else {
          this.errorMessage.set('Error al registrar la reserva aerea en el servidor central.');
        }
      }
    });
  }

  // Cancelar registro
  onCancel(): void {
    this.cancelled.emit();
    if (!this.isModal()) {
      this.router.navigate(['/reservas']);
    }
  }
}
