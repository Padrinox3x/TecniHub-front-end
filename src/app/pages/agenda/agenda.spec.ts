import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Agenda } from './agenda';
import { ItinerarioService } from '../../core/services/itinerario';
import { SessionService } from '../../core/services/session';
import { ItinerarioItem } from '../../core/models/itinerario.models';

describe('Agenda Component (Integration & Validation Tests)', () => {
  let component: Agenda;
  let fixture: ComponentFixture<Agenda>;
  let itinerarioService: ItinerarioService;
  let sessionService: SessionService;

  const mockCitas: ItinerarioItem[] = [
    {
      id: 1,
      servicioId: 101,
      tecnicoId: 20,
      codigoFolio: 'SERV-101',
      tituloServicio: 'Reparación de Refrigerador',
      tipoElectrodomestico: 'Refrigerador',
      ubicacion: 'Centro, Pachuca',
      fechaProgramada: '2026-11-25',
      horaInicio: '09:00',
      horaFinEstimada: '11:00',
      notas: 'Llevar gas refrigerante R134a',
      estado: 'Programado',
      esCompletado: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agenda],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        {
          provide: ItinerarioService,
          useValue: {
            obtenerItinerario: vi.fn().mockReturnValue(of(mockCitas)),
            programarCita: vi.fn(),
            finalizarServicioAgendado: vi.fn().mockReturnValue(of({ mensaje: 'ok' }))
          }
        },
        {
          provide: SessionService,
          useValue: {
            obtenerSesion: vi.fn().mockReturnValue({ usuarioId: 20, rol: 'TECNICO' }),
            obtenerRol: vi.fn().mockReturnValue('TECNICO'),
            estaAutenticado: vi.fn().mockReturnValue(true)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Agenda);
    component = fixture.componentInstance;
    itinerarioService = TestBed.inject(ItinerarioService);
    sessionService = TestBed.inject(SessionService);
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente Agenda', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar las citas del itinerario pasando el técnico en sesión', () => {
    expect(itinerarioService.obtenerItinerario).toHaveBeenCalledWith(false, 20);
    expect(component.citas.length).toBe(1);
    expect(component.citas[0].codigoFolio).toBe('SERV-101');
  });

  it('horarioValido debe ser false si horaFin <= horaInicio', () => {
    component.formHoraInicio = '10:00';
    component.formHoraFin = '09:00';
    expect(component.horarioValido).toBe(false);

    component.formHoraFin = '10:00';
    expect(component.horarioValido).toBe(false);

    component.formHoraFin = '11:30';
    expect(component.horarioValido).toBe(true);
  });

  it('formValido debe exigir servicioId, fecha y horario válido', () => {
    component.formServicioId = '';
    component.formFecha = '2026-11-25';
    component.formHoraInicio = '09:00';
    component.formHoraFin = '11:00';
    expect(component.formValido).toBe(false);

    component.formServicioId = '101';
    expect(component.formValido).toBe(true);
  });

  it('finalizarCita() debe invocar el servicio y recargar itinerario', () => {
    component.finalizarCita(mockCitas[0]);
    expect(itinerarioService.finalizarServicioAgendado).toHaveBeenCalledWith(101);
  });
});
