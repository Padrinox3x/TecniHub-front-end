
export interface TablonItem {
  id: number;
  tipoPublicacion: string;
  titulo: string;
  descripcion: string;

  autorId: number;
  autorNombre: string;
  autorRol: string;

  estado: string;
  modalidad: string;

  codigoColor: string;
  claseCssBorde: string;
  colorHex: string;

  esCompletado: boolean;
  textoIndicador: string | null;

  precio: number | null;
  ubicacion: string | null;
  imagenUrl: string | null;

  fechaPublicacion: string;

  tecnicoAsignadoId: number | null;
  tecnicoAsignadoNombre: string | null;
}

export interface TablonFiltro {
  tipo?: string;
  estado?: string;
  color?: string;
  incluirCompletados?: boolean;
}
