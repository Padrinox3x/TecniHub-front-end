import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Breadcrumb } from './breadcrumb';
import { BreadcrumbService } from '../../services/breadcrumb';

describe('Breadcrumb Component', () => {
  let component: Breadcrumb;
  let fixture: ComponentFixture<Breadcrumb>;
  let service: BreadcrumbService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumb);
    component = fixture.componentInstance;
    service = TestBed.inject(BreadcrumbService);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe generar breadcrumbs para el tablón y chat contextual', () => {
    service.actualizarDesdeRuta('/tablon');
    fixture.detectChanges();
    let texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Inicio');
    expect(texto).toContain('Tablón');

    service.actualizarDesdeRuta('/chat?tipo=servicio&id=42');
    fixture.detectChanges();
    texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Inicio');
    expect(texto).toContain('Tablón');
    expect(texto).toContain('Chat sobre Servicio #42');
  });

  it('debe actualizar el último label dinámicamente', () => {
    service.actualizarDesdeRuta('/detalle-publicacion/servicio/15');
    service.setUltimoLabel('Reparación de Lavadora LG');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reparación de Lavadora LG');
  });
});
