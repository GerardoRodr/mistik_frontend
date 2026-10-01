import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerFormComponent } from './customer-form.component';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/models/customer.models';

describe('CustomerFormComponent', () => {
  let component: CustomerFormComponent;
  let fixture: ComponentFixture<CustomerFormComponent>;
  let customerService: CustomerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFormComponent],
      providers: [
        CustomerService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerFormComponent);
    component = fixture.componentInstance;
    customerService = TestBed.inject(CustomerService);
    fixture.detectChanges();
  });

  it('debe inicializarse con documentType DNI por defecto', () => {
    expect(component.form.get('documentType')?.value).toBe('DNI');
    expect(component.form.valid).toBe(false);
  });

  it('debe validar que DNI tenga exactamente 8 digitos numericos', () => {
    const docControl = component.form.get('documentNumber');

    // Invalido con menos de 8 digitos o letras
    docControl?.setValue('1234');
    expect(docControl?.valid).toBe(false);

    docControl?.setValue('1234567A');
    expect(docControl?.valid).toBe(false);

    // Valido con 8 digitos
    docControl?.setValue('74859612');
    expect(docControl?.valid).toBe(true);
  });

  it('debe actualizar validaciones al cambiar a PASAPORTE', () => {
    component.form.get('documentType')?.setValue('PASAPORTE');
    const docControl = component.form.get('documentNumber');

    docControl?.setValue('A1234567');
    expect(docControl?.valid).toBe(true);
  });

  it('debe filtrar caracteres no numericos en mascara de DNI mediante onDocumentInput', () => {
    const inputElement = document.createElement('input');
    inputElement.value = '74A85-9612999';

    const event = { target: inputElement } as unknown as Event;
    component.onDocumentInput(event);

    expect(inputElement.value).toBe('74859612');
    expect(component.form.get('documentNumber')?.value).toBe('74859612');
  });

  it('debe llamar a createCustomer y emitir evento saved al enviar formulario valido', () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    const mockResponse: Customer = {
      id: 'uuid-1',
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez',
      email: 'lucia@test.com',
      phoneNumber: '+51987654321',
      address: 'Trujillo',
      createdAt: '2026-09-26T00:00:00Z',
      updatedAt: '2026-09-26T00:00:00Z'
    };

    vi.spyOn(customerService, 'createCustomer').mockReturnValue(of(mockResponse));

    component.form.patchValue({
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez',
      email: 'lucia@test.com'
    });

    component.submit();

    expect(customerService.createCustomer).toHaveBeenCalled();
    expect(savedSpy).toHaveBeenCalledWith(mockResponse);
  });

  it('debe capturar error 409 y mostrar mensaje de documento duplicado', () => {
    vi.spyOn(customerService, 'createCustomer').mockReturnValue(
      throwError(() => ({ status: 409 }))
    );

    component.form.patchValue({
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez'
    });

    component.submit();

    expect(component.errorMessage()).toContain('Ya existe un cliente con el documento');
  });
});
