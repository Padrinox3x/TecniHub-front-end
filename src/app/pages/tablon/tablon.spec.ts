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

  it('debe tener valores por defecto de paginación (página 1, 6 por página)', () => {
    expect(component.paginaActual).toBe(1);
    expect(component.elementosPorPagina).toBe(6);
  });

  it('debe paginar correctamente mostrando como máximo 6 publicaciones por página', () => {
    const diezPublicaciones: TablonItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      tipoPublicacion: 'SERVICIO',
      titulo: `Servicio ${i + 1}`,
      descripcion: `Desc ${i + 1}`,
      autorId: i + 1,
      autorNombre: `Autor ${i + 1}`,
      autorRol: 'CLIENTE',
      estado: 'Disponible',
      modalidad: 'A Domicilio',
      codigoColor: '#2563eb',
      claseCssBorde: 'border-blue',
      colorHex: '#2563eb',
      esCompletado: false,
      textoIndicador: null,
      precio: null,
      ubicacion: 'Pachuca',
      imagenUrl: null,
      fechaPublicacion: '2026-11-20T10:00:00Z',
      tecnicoAsignadoId: null,
      tecnicoAsignadoNombre: null
    }));

    component.publicaciones = diezPublicaciones;
    expect(component.totalPaginas).toBe(2);
    expect(component.publicacionesPaginadas.length).toBe(6);
    expect(component.publicacionesPaginadas[0].id).toBe(1);

    component.cambiarPagina(2);
    expect(component.paginaActual).toBe(2);
    expect(component.publicacionesPaginadas.length).toBe(4);
    expect(component.publicacionesPaginadas[0].id).toBe(7);
  });

  it('no debe cambiar de página si el número es inválido', () => {
    component.paginaActual = 1;
    component.cambiarPagina(0);
    expect(component.paginaActual).toBe(1);

    component.cambiarPagina(999);
    expect(component.paginaActual).toBe(1);
  });
});
