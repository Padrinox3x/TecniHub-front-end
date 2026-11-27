import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImagenStorageService {
  /**
   * Comprime y redimensiona una imagen para optimizar su peso (máximo 800px, JPEG al 75%).
   * Reduce fotos de 5MB a aproximadamente 60-120KB para evitar exceder la cuota de localStorage.
   */
  comprimirImagen(file: File, maxDim = 800, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Guarda la imagen en localStorage vinculándola al nombre del archivo, id y título.
   */
  guardarImagenLocal(
    tipo: 'servicio' | 'pieza',
    dataUrl: string,
    fileName?: string,
    id?: number | string,
    titulo?: string
  ): void {
    if (!dataUrl) return;
    try {
      if (fileName) {
        localStorage.setItem(`tecnihub_img_file_${fileName}`, dataUrl);
      }
      if (id) {
        localStorage.setItem(`tecnihub_img_${tipo}_${id}`, dataUrl);
      }
      if (titulo) {
        localStorage.setItem(`tecnihub_img_${tipo}_${titulo.trim()}`, dataUrl);
      }
      localStorage.setItem(`tecnihub_ultima_img_${tipo}`, dataUrl);
    } catch (e) {
      console.warn('[IMAGEN STORAGE] No se pudo guardar en localStorage:', e);
    }
  }

  /**
   * Recupera la imagen seleccionada por el usuario para una publicación o utiliza la URL válida.
   * Si no existe ninguna, devuelve el fallback representativo de la categoría.
   */
  obtenerImagen(
    tipo: 'SERVICIO' | 'PIEZA' | string,
    imagenUrl?: string | null,
    id?: number | string | null,
    titulo?: string | null
  ): string {
    const tipoNormalizado = tipo?.toUpperCase() === 'SERVICIO' ? 'servicio' : 'pieza';

    try {
      // 1. Por nombre de archivo subido (vinculación directa)
      if (imagenUrl) {
        const porArchivo = localStorage.getItem(`tecnihub_img_file_${imagenUrl}`);
        if (porArchivo) return porArchivo;
      }

      // 2. Por ID de publicación
      if (id) {
        const porId = localStorage.getItem(`tecnihub_img_${tipoNormalizado}_${id}`);
        if (porId) return porId;
      }

      // 3. Por Título de la publicación
      if (titulo) {
        const porTitulo = localStorage.getItem(`tecnihub_img_${tipoNormalizado}_${titulo.trim()}`);
        if (porTitulo) return porTitulo;
      }

      // 4. Última imagen subida si no tiene ninguna
      const ultima = localStorage.getItem(`tecnihub_ultima_img_${tipoNormalizado}`);
      if (ultima && (!imagenUrl || !imagenUrl.startsWith('http'))) {
        return ultima;
      }
    } catch {
      // Ignorar si localStorage no está disponible en el entorno
    }

    // 5. Si imagenUrl es una URL remota válida (http/https/data)
    if (
      imagenUrl &&
      (imagenUrl.startsWith('http://') ||
        imagenUrl.startsWith('https://') ||
        imagenUrl.startsWith('data:'))
    ) {
      return imagenUrl;
    }

    // 6. Fallback visual por defecto según tipo
    return tipoNormalizado === 'servicio'
      ? 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
  }
}
