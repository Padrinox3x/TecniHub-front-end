import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { Registro } from './registro';
import { AuthService } from '../../core/services/auth';
import { AuthResponse } from '../../core/models/auth.models';

describe('Registro Component (Unit & Validation Tests)', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('debe crear el componente de Registro', () => {
    expect(component).toBeTruthy();
  });

  it('cambiarTipo() debe alternar correctamente entre CLIENTE y TECNICO', () => {
    expect(component.tipoCuenta).toBe('CLIENTE');
    component.cambiarTipo('TECNICO');
    expect(component.tipoCuenta).toBe('TECNICO');
    component.cambiarTipo('CLIENTE');
    expect(component.tipoCuenta).toBe('CLIENTE');
  });

  it('clienteFormValido debe ser false si faltan campos obligatorios o teléfono < 10 dígitos', () => {
    component.nombre = 'Ana';
    component.apellidos = 'Gomez';
    component.email = 'ana@test.com';
    component.password = '12345678';
    component.telefono = '771123'; // Incompleto
    expect(component.clienteFormValido).toBe(false);

    component.telefono = '7711234567'; // 10 dígitos exactos
    expect(component.clienteFormValido).toBe(true);
  });

  it('tecnicoFormValido debe exigir ubicacionEstablecimiento si tieneNegocioFisico es true', () => {
    component.tipoCuenta = 'TECNICO';
    component.nombreCompleto = 'Carlos Tecnico';
    component.email = 'carlos@test.com';
    component.password = 'Password123';
    component.telefono = '7719876543';
    component.tieneNegocioFisico = true;
    component.ubicacionEstablecimiento = '';

    expect(component.tecnicoFormValido).toBe(false);

    component.ubicacionEstablecimiento = 'Av. Insurgentes #45, Pachuca';
    expect(component.tecnicoFormValido).toBe(true);
  });

  it('debe registrar un cliente correctamente', () => {
    const mockRes: AuthResponse = {
      token: 'jwt.token',
      expiracion: '2026-12-31T23:59:59Z',
      usuarioId: 5,
      email: 'ana@test.com',
      rol: 'CLIENTE'
    };

    vi.spyOn(authService, 'registrarCliente').mockReturnValue(of(mockRes));

    component.nombre = 'Ana';
    component.apellidos = 'Gomez';
    component.email = 'ana@test.com';
    component.password = 'Password123';
    component.telefono = '7711234567';
    component.direccion = 'Calle 1';

    component.registrar();

    expect(authService.registrarCliente).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellidos: 'Gomez',
      telefono: '7711234567',
      direccion: 'Calle 1',
      email: 'ana@test.com',
      contrasena: 'Password123'
    });
    expect(component.successMessage).toContain('creada exitosamente');
  });
});
