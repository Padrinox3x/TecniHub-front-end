import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Tablon } from './tablon';
import { TablonService } from '../../core/services/tablon';
import { TablonItem } from '../../core/models/tablon.models';

describe('Tablon Component (Integration & Navigation Tests)', () => {
  let component: Tablon;
  let fixture: ComponentFixture<Tablon>;
  let tablonService: TablonService;

  const mockPublicaciones: TablonItem[] = [
    {
      id: 101,
      tipoPublicacion: 'SERVICIO',
      titulo: 'Reparación de Refrigerador',
      descripcion: 'No enfría el congelador',
      autorId: 10,
      autorNombre: 'Carlos Cliente',
      autorRol: 'CLIENTE',
      estado: 'EnProceso',
      modalidad: 'A Domicilio',
      codigoColor: '#2563eb',
      claseCssBorde: 'border-blue',
      colorHex: '#2563eb',
      esCompletado: false,
      textoIndicador: null,
      precio: null,
      ubicacion: 'Centro, Pachuca',
      imagenUrl: null,
      fechaPublicacion: '2026-11-20T10:00:00Z',
      tecnicoAsignadoId: 20,
      tecnicoAsignadoNombre: 'Mario Técnico'
    },
    {
      id: 202,
      tipoPublicacion: 'PIEZA',
      titulo: 'Motor Lavadora Whirlpool',
      descripcion: 'Motor funcional usado',
      autorId: 20,
      autorNombre: 'Mario Técnico',
      autorRol: 'TECNICO',
      estado: 'Disponible',
      modalidad: 'Venta',
      codigoColor: '#16a34a',
      claseCssBorde: 'border-green',
      colorHex: '#16a34a',
      esCompletado: false,
      textoIndicador: null,
      precio: 850.0,
      ubicacion: null,
      imagenUrl: null,
      fechaPublicacion: '2026-11-21T12:00:00Z',
      tecnicoAsignadoId: null,
      tecnicoAsignadoNombre: null
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tablon],
      providers: [
        provideRouter([]),
        {
          provide: TablonService,
          useValue: {
            obtenerPublicaciones: vi.fn().mockReturnValue(of(mockPublicaciones))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tablon);
    component = fixture.componentInstance;
    tablonService = TestBed.inject(TablonService);
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente Tablon', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar las publicaciones al inicializarse', () => {
    expect(tablonService.obtenerPublicaciones).toHaveBeenCalled();
    expect(component.publicaciones.length).toBe(2);
  });

  it('cambiarTipo() debe actualizar tipoSeleccionado y recargar', () => {
    component.cambiarTipo('PIEZA');
    expect(component.tipoSeleccionado).toBe('PIEZA');
    expect(tablonService.obtenerPublicaciones).toHaveBeenCalledWith({
      tipo: 'PIEZA',
      incluirCompletados: false
    });
  });

  it('obtenerRutaPerfilAutor() debe devolver /perfil/cliente para solicitudes de servicio', () => {
    const servicioItem = mockPublicaciones[0];
    const ruta = component.obtenerRutaPerfilAutor(servicioItem);
    expect(ruta).toEqual(['/perfil', 'cliente', '10']);
  });

  it('obtenerRutaPerfilAutor() debe devolver /perfil/tecnico para piezas de refacción', () => {
    const piezaItem = mockPublicaciones[1];
    const ruta = component.obtenerRutaPerfilAutor(piezaItem);
    expect(ruta).toEqual(['/perfil', 'tecnico', '20']);
  });

  it('obtenerRutaPerfilTecnicoAsignado() debe devolver la ruta al perfil del técnico', () => {
    const ruta = component.obtenerRutaPerfilTecnicoAsignado(20);
    expect(ruta).toEqual(['/perfil', 'tecnico', '20']);
  });

  it('obtenerInicialAutor() debe ignorar @ inicial y devolver la primera letra en mayúscula', () => {
    expect(component.obtenerInicialAutor('@Rodrigo D.')).toBe('R');
    expect(component.obtenerInicialAutor('@@carlos')).toBe('C');
    expect(component.obtenerInicialAutor('Mario Técnico')).toBe('M');
    expect(component.obtenerInicialAutor('')).toBe('U');
    expect(component.obtenerInicialAutor(null)).toBe('U');
  });
});
