import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App · navegación Sprint 3', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('crea la aplicación', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('presenta enlaces a las tres vistas del Sprint 3', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('nav a')).map((link) => link.textContent?.trim());

    expect(links).toEqual(['＋ Solicitar servicio', '⌕ Piezas', '▦ Mi itinerario']);
    expect(compiled.querySelector('.sprint-label')?.textContent).toContain('Sprint 3');
  });
});
