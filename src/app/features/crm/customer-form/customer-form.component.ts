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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../../core/models/customer.models';

export type DocumentTypeOption = 'DNI' | 'PASAPORTE' | 'CE';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form.component.html'
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);

  // Entradas del componente
  readonly customer = input<Customer | null>(null);
  readonly isModal = input<boolean>(false);

  // Emisiones de eventos
  readonly saved = output<Customer>();
  readonly cancelled = output<void>();

  // Senales reactivas de estado
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Modo edicion computado
  readonly isEditMode = computed(() => !!this.customer());

  // Formulario reactivo con validaciones estrictas
  readonly form = this.fb.group({
    documentType: ['DNI' as DocumentTypeOption, [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(70)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(70)]],
    email: ['', [Validators.email]],
    phoneNumber: ['', [Validators.pattern(/^[0-9+\s-]{7,20}$/)]],
    address: ['', [Validators.maxLength(150)]]
  });

  constructor() {
    // Sincronizar formulario cuando cambia el cliente de entrada
    effect(() => {
      const current = this.customer();
      if (current) {
        this.form.patchValue({
          documentType: (current.documentType as DocumentTypeOption) || 'DNI',
          documentNumber: current.documentNumber,
          firstName: current.firstName,
          lastName: current.lastName,
          email: current.email || '',
          phoneNumber: current.phoneNumber || '',
          address: current.address || ''
        });
        this.updateDocumentValidators(current.documentType as DocumentTypeOption);
      } else {
        this.form.reset({ documentType: 'DNI' });
        this.updateDocumentValidators('DNI');
      }
      this.errorMessage.set(null);
    });
  }

  ngOnInit(): void {
    // Escuchar cambios en tipo de documento para actualizar validadores
    this.form.get('documentType')?.valueChanges.subscribe((type) => {
      if (type) {
        this.updateDocumentValidators(type as DocumentTypeOption);
      }
    });
  }

  // Actualizar validaciones de documento segun tipo seleccionado
  private updateDocumentValidators(type: DocumentTypeOption): void {
    const docControl = this.form.get('documentNumber');
    if (!docControl) return;

    if (type === 'DNI') {
      docControl.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
    } else if (type === 'PASAPORTE') {
      docControl.setValidators([
        Validators.required,
        Validators.pattern(/^[A-Z0-9]{6,12}$/)
      ]);
    } else if (type === 'CE') {
      docControl.setValidators([
        Validators.required,
        Validators.pattern(/^[A-Z0-9]{9,12}$/)
      ]);
    }

    docControl.updateValueAndValidity();
  }

  // Filtrar y aplicar mascara al numero de documento en tiempo real
  onDocumentInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const type = this.form.get('documentType')?.value as DocumentTypeOption;
    let clean = input.value;

    if (type === 'DNI') {
      // Mascara para DNI: solo digitos numericos, maximo 8
      clean = clean.replace(/\D/g, '').slice(0, 8);
    } else {
      // Mascara para Pasaporte o CE: alfanumerico en mayusculas, maximo 12
      clean = clean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
    }

    input.value = clean;
    this.form.get('documentNumber')?.setValue(clean, { emitEvent: false });
  }

  // Formatear telefono al escribir
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let clean = input.value.replace(/[^\d+]/g, '');
    if (clean.length > 15) {
      clean = clean.slice(0, 15);
    }
    input.value = clean;
    this.form.get('phoneNumber')?.setValue(clean, { emitEvent: false });
  }

  // Enviar formulario
  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    const currentCustomer = this.customer();

    if (currentCustomer) {
      // Modo actualizacion
      const updateDto: UpdateCustomerDto = {
        documentType: val.documentType || undefined,
        documentNumber: val.documentNumber?.trim() || undefined,
        firstName: val.firstName?.trim() || undefined,
        lastName: val.lastName?.trim() || undefined,
        email: val.email ? val.email.trim() : null as any,
        phoneNumber: val.phoneNumber ? val.phoneNumber.trim() : null as any,
        address: val.address ? val.address.trim() : null as any
      };

      this.customerService.updateCustomer(currentCustomer.id, updateDto).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.saved.emit(updated);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleHttpError(err, val.documentType!, val.documentNumber!);
        }
      });
    } else {
      // Modo creacion
      const createDto: CreateCustomerDto = {
        documentType: val.documentType!,
        documentNumber: val.documentNumber!.trim(),
        firstName: val.firstName!.trim(),
        lastName: val.lastName!.trim(),
        email: val.email ? val.email.trim() : undefined,
        phoneNumber: val.phoneNumber ? val.phoneNumber.trim() : undefined,
        address: val.address ? val.address.trim() : undefined
      };

      this.customerService.createCustomer(createDto).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.saved.emit(created);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleHttpError(err, val.documentType!, val.documentNumber!);
        }
      });
    }
  }

  // Gestion centralizada de errores HTTP
  private handleHttpError(err: HttpErrorResponse, docType: string, docNumber: string): void {
    if (err.status === 409) {
      this.errorMessage.set(`Ya existe un cliente con el documento ${docType} ${docNumber}.`);
    } else if (err.status === 0) {
      this.errorMessage.set('Sin conexion con el servidor backend central.');
    } else if (err.error?.message) {
      const msg = Array.isArray(err.error.message)
        ? err.error.message.join(', ')
        : err.error.message;
      this.errorMessage.set(msg);
    } else {
      this.errorMessage.set('No se pudo procesar la operacion del cliente.');
    }
  }

  // Cancelar accion
  onCancel(): void {
    this.cancelled.emit();
  }

  // Helpers para validacion visual en plantilla
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
