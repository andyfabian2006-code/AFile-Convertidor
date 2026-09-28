// src/js/converters/encoders/native-encoder.js
import { FORMAT_INFO } from '../registry.js';

/**
 * Codificador nativo (PNG, JPG, WEBP, AVIF)
 */
export async function encode(imageDataOrCanvas, format, options = {}) {
  const mime = FORMAT_INFO[format].mime;
  let canvas = imageDataOrCanvas;
  
  // If we got an ImageBitmap or ImageData, we need a canvas to export
  const isOffscreen = typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
  const isHTMLCanvas = typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement;
  
  if (!isOffscreen && !isHTMLCanvas) {
    let width = canvas.width;
    let height = canvas.height;
    
    if (typeof OffscreenCanvas !== 'undefined') {
      const offCanvas = new OffscreenCanvas(width, height);
      const ctx = offCanvas.getContext('2d');
      if (canvas instanceof ImageData) {
        ctx.putImageData(canvas, 0, 0);
      } else {
        ctx.drawImage(canvas, 0, 0);
      }
      canvas = offCanvas;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (canvas instanceof ImageData) {
        ctx.putImageData(canvas, 0, 0);
      } else {
        ctx.drawImage(canvas, 0, 0);
      }
    }
  }

  // Opciones de calidad
  const quality = options.quality !== undefined ? options.quality / 100 : 0.85;

  return new Promise((resolve, reject) => {
    if (canvas.convertToBlob) {
      // OffscreenCanvas
      canvas.convertToBlob({ type: mime, quality }).then(blob => {
        if (blob.type !== mime) {
          // Si el navegador no soporta el formato (ej. AVIF), fallback a PNG
          reject(new Error(`Formato ${format} no soportado por este navegador.`));
          return;
        }
        resolve(blob);
      }).catch(reject);
    } else {
      // HTMLCanvasElement
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Fallo al exportar el canvas.'));
          return;
        }
        if (blob.type !== mime) {
          reject(new Error(`Formato ${format} no soportado por este navegador.`));
          return;
        }
        resolve(blob);
      }, mime, quality);
    }
  });
}
