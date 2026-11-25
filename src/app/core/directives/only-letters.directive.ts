import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appOnlyLetters]',
  standalone: true
})
export class OnlyLettersDirective {
  @Input() allowSpaces: boolean = true;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    // Permitir letras del alfabeto, tildes, diéresis, ñ y opcionalmente espacios
    const regex = this.allowSpaces
      ? /[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ\s]/g
      : /[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ]/g;

    const sanitized = input.value.replace(regex, '');
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
    const regex = this.allowSpaces
      ? /[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ\s]/g
      : /[^a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ]/g;

    if (regex.test(pastedText)) {
      event.preventDefault();
      const sanitized = pastedText.replace(regex, '');
      document.execCommand('insertText', false, sanitized);
    }
  }
}
