import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Breadcrumb } from './breadcrumb';
import { BreadcrumbService } from '../../services/breadcrumb';

describe('Breadcrumb Component & Service', () => {
  let component: Breadcrumb;
  let fixture: ComponentFixture<Breadcrumb>;
  let breadcrumbService: BreadcrumbService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [provideRouter([]), BreadcrumbService]
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumb);
    component = fixture.componentInstance;
    breadcrumbService = TestBed.inject(BreadcrumbService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente Breadcrumb', () => {
    expect(component).toBeTruthy();
  });

  it('debe permitir configurar y emitir breadcrumbs personalizados', () => {
    breadcrumbService.setBreadcrumbs([
      { label: 'Inicio', url: '/inicio' },
      { label: 'Tablón', url: '/tablon' },
      { label: 'Detalle' }
    ]);
    fixture.detectChanges();

    expect(component.breadcrumbsList.length).toBe(3);
    expect(component.breadcrumbsList[0].label).toBe('Inicio');
    expect(component.breadcrumbsList[2].label).toBe('Detalle');
  });

  it('debe actualizar el último label mediante setUltimoLabel', () => {
    breadcrumbService.setBreadcrumbs([
      { label: 'Inicio', url: '/inicio' },
      { label: 'Detalle genérico' }
    ]);
    fixture.detectChanges();

    breadcrumbService.setUltimoLabel('Reparación de Lavadora Whirlpool');
    fixture.detectChanges();

    expect(component.breadcrumbsList[1].label).toBe('Reparación de Lavadora Whirlpool');
  });
});
