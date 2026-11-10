import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Sprint3ApiService } from './sprint3-api.service';

describe('Sprint3ApiService', () => {
  let service: Sprint3ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Sprint3ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta categorías para HU-007 y HU-008', () => {
    service.obtenerCategorias().subscribe();
    const request = http.expectOne('/api/servicios/categorias');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('publica solicitudes de servicio HU-007', () => {
    const body = {
      clienteId: 'cliente-uuid', categoriaId: 1, tipoElectrodomestico: 'Refrigerador',
      descripcionFalla: 'No enfría', ubicacionAproximada: 'Centro',
    };
    service.crearServicio(body).subscribe();
    const request = http.expectOne('/api/servicios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ id: 'servicio-uuid', codigoFolio: 'SRV-1', estado: 'ABIERTO' });
  });

  it('busca y publica piezas HU-008 con los filtros y payload correspondientes', () => {
    service.buscarPiezas({ texto: 'motor', categoriaId: 2, modalidad: 'VENTA', precioMaximo: 500 }).subscribe();
    const search = http.expectOne((request) => request.url === '/api/piezas');
    expect(search.request.method).toBe('GET');
    expect(search.request.params.get('texto')).toBe('motor');
    expect(search.request.params.get('categoriaId')).toBe('2');
    expect(search.request.params.get('modalidad')).toBe('VENTA');
    expect(search.request.params.get('precioMaximo')).toBe('500');
    search.flush([]);

    const body = {
      tecnicoId: 'tecnico-uuid', categoriaId: 2, nombre: 'Motor', descripcion: 'Funciona',
      condicion: 'USADO_BUENO', modalidad: 'VENTA' as const, precio: 250,
      medioContacto: 'correo@test.local', ubicacionEntrega: 'Centro',
    };
    service.publicarPieza(body).subscribe();
    const publish = http.expectOne('/api/piezas');
    expect(publish.request.method).toBe('POST');
    expect(publish.request.body).toEqual(body);
    publish.flush({ id: 'pieza-uuid' });
  });

  it('programa itinerarios HU-010', () => {
    const body = {
      servicioId: 'servicio-uuid', tecnicoId: 'tecnico-uuid', actorId: 'tecnico-uuid',
      fecha: '2026-11-15', horaInicio: '09:00:00', horaFinEstimada: '10:00:00',
    };
    service.programarItinerario(body).subscribe();
    const request = http.expectOne('/api/itinerarios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ servicioId: body.servicioId, fecha: body.fecha, horaInicio: body.horaInicio,
      horaFinEstimada: body.horaFinEstimada, estado: 'PROGRAMADO' });
  });
});
