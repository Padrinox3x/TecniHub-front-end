import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Categoria, CrearServicioRequest, Sprint3ApiService } from '../sprint3-api.service';

@Component({
  selector: 'app-solicitud-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-servicio.component.html',
  styleUrl: './solicitud-servicio.component.css',
})
export class SolicitudServicioComponent implements OnInit {
  private readonly api = inject(Sprint3ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  categories: Categoria[] = [];
  saving = false;
  message = '';
  error = '';
  resultCode = '';

  model: CrearServicioRequest = {
    clienteId: '',
    categoriaId: 0,
    tipoElectrodomestico: '',
    marca: '',
    modelo: '',
    descripcionFalla: '',
    ubicacionAproximada: '',
    municipio: '',
    fechaSolicitud: '',
    horarioPreferido: '',
  };

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      this.api.obtenerCategorias().subscribe({
        next: (categories) => {
          this.categories = categories;
          this.changeDetector.markForCheck();
        },
        error: (err) => {
          this.error = this.api.mensajeError(err, 'No fue posible cargar las categorías.');
          this.changeDetector.markForCheck();
        },
      });
    });
  }

  submit(form: NgForm): void {
    this.message = '';
    this.error = '';
    this.resultCode = '';
    if (form.invalid || !this.model.categoriaId) {
      form.control.markAllAsTouched();
      if (!this.model.categoriaId) this.error = 'Selecciona una categoría de electrodoméstico.';
      return;
    }

    this.saving = true;
    const request = { ...this.model };
    if (!request.fechaSolicitud) delete request.fechaSolicitud;
    this.api.crearServicio(request).subscribe({
      next: (result) => {
        this.resultCode = result.codigoFolio;
        this.message = 'Tu solicitud quedó publicada para que los técnicos puedan consultarla.';
        form.resetForm({
          clienteId: this.model.clienteId,
          categoriaId: 0,
          tipoElectrodomestico: '',
          marca: '',
          modelo: '',
          descripcionFalla: '',
          ubicacionAproximada: '',
          municipio: '',
          fechaSolicitud: '',
          horarioPreferido: '',
        });
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.api.mensajeError(err, 'No fue posible publicar la solicitud.');
        this.changeDetector.markForCheck();
      },
      complete: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
