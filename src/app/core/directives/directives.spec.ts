import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { OnlyLettersDirective } from './only-letters.directive';
import { OnlyNumbersDirective } from './only-numbers.directive';
import { DecimalNumberDirective } from './decimal-number.directive';

@Component({
  standalone: true,
  imports: [FormsModule, OnlyLettersDirective, OnlyNumbersDirective, DecimalNumberDirective],
  template: `
    <input id="lettersInput" appOnlyLetters [(ngModel)]="lettersVal" />
    <input id="numbersInput" appOnlyNumbers [maxDigits]="5" [(ngModel)]="numbersVal" />
    <input id="decimalInput" appDecimalNumber [maxDecimals]="2" [(ngModel)]="decimalVal" />
  `
})
class TestHostComponent {
  lettersVal = '';
  numbersVal = '';
  decimalVal = '';
}

describe('Directivas de Validación en Tiempo Real (Unit Tests)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('OnlyLettersDirective', () => {
    it('debe filtrar números y símbolos pero conservar letras y acentos', () => {
      const inputEl = fixture.nativeElement.querySelector('#lettersInput') as HTMLInputElement;

      inputEl.value = 'Juan123 Perez!';
      inputEl.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(inputEl.value).toBe('Juan Perez');
    });

    it('debe admitir caracteres españoles como ñ, á, é, í, ó, ú', () => {
      const inputEl = fixture.nativeElement.querySelector('#lettersInput') as HTMLInputElement;

      inputEl.value = 'María Peña';
      inputEl.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(inputEl.value).toBe('María Peña');
    });
  });

  describe('OnlyNumbersDirective', () => {
    it('debe remover letras y respetar maxDigits', () => {
      const inputEl = fixture.nativeElement.querySelector('#numbersInput') as HTMLInputElement;

      inputEl.value = 'abc1234567def';
      inputEl.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(inputEl.value).toBe('12345'); // recortado a 5 dígitos
    });
  });

  describe('DecimalNumberDirective', () => {
    it('debe permitir un solo punto decimal y limitar a maxDecimals=2', () => {
      const inputEl = fixture.nativeElement.querySelector('#decimalInput') as HTMLInputElement;

      inputEl.value = '150.999';
      inputEl.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(inputEl.value).toBe('150.99');
    });

    it('debe impedir múltiples puntos decimales', () => {
      const inputEl = fixture.nativeElement.querySelector('#decimalInput') as HTMLInputElement;

      inputEl.value = '10.50.80';
      inputEl.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(inputEl.value).toBe('10.50');
    });
  });
});
