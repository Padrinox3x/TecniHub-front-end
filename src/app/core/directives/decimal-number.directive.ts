import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appDecimalNumber]',
  standalone: true
})
export class DecimalNumberDirective {
  @Input() maxDecimals: number = 2;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    // Permitir dígitos y punto decimal
    let value = input.value.replace(/[^0-9.]/g, '');

    // Permitir un solo punto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limitar la cantidad de decimales
    if (parts.length === 2 && parts[1].length > this.maxDecimals) {
      value = parts[0] + '.' + parts[1].slice(0, this.maxDecimals);
    }

    if (input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text');
    let value = pastedText.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > this.maxDecimals) {
      value = parts[0] + '.' + parts[1].slice(0, this.maxDecimals);
    }

    if (value !== pastedText) {
      event.preventDefault();
      document.execCommand('insertText', false, value);
    }
  }
}
