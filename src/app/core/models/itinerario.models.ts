export interface ProgramarItinerarioRequest {
  servicioId: string;
  tecnicoId: string;
  actorId?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFinEstimada: string; // HH:mm
  notas?: string | null;
}

export interface ItinerarioProgramado {
  servicioId: string;
  fecha: string;
  horaInicio: string;
  horaFinEstimada: string;
  estado: string;
  advertencia?: string | null;
}

export interface ItinerarioItem {
  id: number;
  servicioId: number;
  codigoFolio: string;
  tecnicoId: number;
  tecnicoNombre?: string | null;
  tituloServicio: string;
  tipoElectrodomestico: string;
  ubicacion: string;
  fechaProgramada: string;
  horaInicio: string;
  horaFinEstimada: string;
  notas?: string | null;
  estado: string;
  esCompletado: boolean;
}
