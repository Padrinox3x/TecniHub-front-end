import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth';
import { LoginRequest, AuthResponse, RegistroClienteRequest } from '../models/auth.models';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('login() debe enviar credenciales y recibir AuthResponse', () => {
    const creds: LoginRequest = { email: 'cliente@test.com', contrasena: 'Password123' };
    const mockResponse: AuthResponse = {
      token: 'jwt.mock.token',
      expiracion: '2026-12-31T23:59:59Z',
      usuarioId: 1,
      email: 'cliente@test.com',
      rol: 'CLIENTE'
    };

    service.login(creds).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.rol).toBe('CLIENTE');
      expect(res.usuarioId).toBe(1);
    });

    const req = httpMock.expectOne('https://d2c9vof7dxdez3.cloudfront.net/api/Auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(creds);
    req.flush(mockResponse);
  });

  it('registrarCliente() debe enviar datos y retornar AuthResponse', () => {
    const registroData: RegistroClienteRequest = {
      nombre: 'Juan',
      apellidos: 'Perez',
      telefono: '7711234567',
      direccion: 'Centro Ixmiquilpan',
      email: 'juan@test.com',
      contrasena: 'Password123'
    };

    const mockResponse: AuthResponse = {
      token: 'jwt.client.token',
      expiracion: '2026-12-31T23:59:59Z',
      usuarioId: 2,
      email: 'juan@test.com',
      rol: 'CLIENTE'
    };

    service.registrarCliente(registroData).subscribe((res) => {
      expect(res.usuarioId).toBe(2);
      expect(res.email).toBe('juan@test.com');
    });

    const req = httpMock.expectOne('https://d2c9vof7dxdez3.cloudfront.net/api/Auth/registro');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
