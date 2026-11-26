import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appOnlyNumbers]',
  standalone: true
})
export class OnlyNumbersDirective {
  @Input() maxDigits?: number;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    let sanitized = input.value.replace(/\D/g, '');
    if (this.maxDigits && sanitized.length > this.maxDigits) {
      sanitized = sanitized.slice(0, this.maxDigits);
    }

    if (input.value !== sanitized) {
      input.value = sanitized;
      input.dispatchEvent(new Event('input'));
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text');
    let sanitized = pastedText.replace(/\D/g, '');
    if (this.maxDigits && sanitized.length > this.maxDigits) {
      sanitized = sanitized.slice(0, this.maxDigits);
    }

    if (sanitized !== pastedText) {
      event.preventDefault();
      document.execCommand('insertText', false, sanitized);
    }
  }
}
