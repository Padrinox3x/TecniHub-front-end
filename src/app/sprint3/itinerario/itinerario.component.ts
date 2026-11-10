import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ProgramarItinerarioRequest, Sprint3ApiService } from '../sprint3-api.service';

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itinerario.component.html',
  styleUrl: './itinerario.component.css',
})
export class ItinerarioComponent implements OnInit {
  private readonly api = inject(Sprint3ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  saving = false;
  error = '';
  message = '';
  model: ProgramarItinerarioRequest = {
    servicioId: '', tecnicoId: '', actorId: '', fecha: '', horaInicio: '', horaFinEstimada: '', notas: '',
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.model.fecha = new Date().toISOString().slice(0, 10);
        this.changeDetector.markForCheck();
      });
    }
  }

  syncActor(): void {
    this.model.actorId = this.model.tecnicoId;
  }

  submit(form: NgForm): void {
    this.error = '';
    this.message = '';
    this.syncActor();
    if (form.invalid || this.model.horaFinEstimada <= this.model.horaInicio) {
      form.control.markAllAsTouched();
      if (this.model.horaFinEstimada <= this.model.horaInicio) this.error = 'La hora estimada de fin debe ser posterior a la hora de inicio.';
      return;
    }

    this.saving = true;
    const request = {
      ...this.model,
      horaInicio: this.toTime(this.model.horaInicio),
      horaFinEstimada: this.toTime(this.model.horaFinEstimada),
    };
    this.api.programarItinerario(request).subscribe({
      next: (result) => {
        this.message = `Servicio agendado para ${result.fecha} de ${result.horaInicio.slice(0, 5)} a ${result.horaFinEstimada.slice(0, 5)}.`;
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.api.mensajeError(err, 'No fue posible programar el servicio. Revisa que esté aceptado y asignado a este técnico.');
        this.changeDetector.markForCheck();
      },
      complete: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private toTime(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }
}
