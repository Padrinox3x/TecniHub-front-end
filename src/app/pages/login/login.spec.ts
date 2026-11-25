import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../core/services/auth';
import { SessionService } from '../../core/services/session';
import { AuthResponse } from '../../core/models/auth.models';

describe('Login Component (Unit & Form Tests)', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: AuthService;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([{ path: 'inicio', component: class DummyComponent {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        SessionService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente Login', () => {
    expect(component).toBeTruthy();
  });

  it('emailValido debe retornar false ante correos inválidos y true ante válidos', () => {
    component.email = 'invalido';
    expect(component.emailValido).toBe(false);

    component.email = 'test@';
    expect(component.emailValido).toBe(false);

    component.email = 'usuario@tecnihub.com';
    expect(component.emailValido).toBe(true);
  });

  it('formValido debe ser false si falta correo o contraseña', () => {
    component.email = 'usuario@tecnihub.com';
    component.password = '';
    expect(component.formValido).toBe(false);

    component.password = 'Password123';
    expect(component.formValido).toBe(true);
  });

  it('debe iniciar sesión exitosamente y persistir la sesión', () => {
    const mockAuth: AuthResponse = {
      token: 'jwt.token.mock',
      expiracion: '2026-12-31T23:59:59Z',
      usuarioId: 10,
      email: 'tecnico@test.com',
      rol: 'TECNICO'
    };

    vi.spyOn(authService, 'login').mockReturnValue(of(mockAuth));
    const sessionSpy = vi.spyOn(sessionService, 'guardarSesion');

    component.email = 'tecnico@test.com';
    component.password = 'Password123';
    component.iniciarSesion();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'tecnico@test.com',
      contrasena: 'Password123'
    });
    expect(sessionSpy).toHaveBeenCalledWith(mockAuth);
  });

  it('debe manejar error 401 mostrando mensaje de credenciales incorrectas', () => {
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ status: 401, error: { mensaje: 'Credenciales inválidas' } }))
    );

    component.email = 'err@test.com';
    component.password = 'Password123';
    component.iniciarSesion();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('Credenciales inválidas');
  });
});
