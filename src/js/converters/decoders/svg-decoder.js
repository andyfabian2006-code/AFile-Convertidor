// src/js/converters/decoders/svg-decoder.js

/**
 * Decodificador SVG seguro.
 * Valida tamaño y dimensiones para evitar bombas de procesamiento,
 * y lo carga sin inyectarlo en el DOM.
 */
export async function decode(blob, options = {}) {
  if (blob.size > 2 * 1024 * 1024) {
    throw new Error('El archivo SVG excede el límite de 2MB para seguridad.');
  }

  // Check for dimensions in text (very basic check)
  const text = await blob.text();
  const svgMatch = text.match(/<svg[^>]+>/i);
  if (!svgMatch) {
    throw new Error('Archivo SVG inválido.');
  }
  const svgTag = svgMatch[0];
  const hasWidthHeight = /width=["'][0-9\.]+["']/i.test(svgTag) && /height=["'][0-9\.]+["']/i.test(svgTag);
  const hasViewBox = /viewBox=["'][0-9\.\s]+["']/i.test(svgTag);

  if (!hasWidthHeight && !hasViewBox) {
    throw new Error('El SVG no tiene dimensiones (width/height o viewBox) explícitas. Imposible renderizar de forma segura.');
  }

  // Load via Blob URL
  const url = URL.createObjectURL(blob);
  
  try {
    if (typeof window === 'undefined') {
      // In Worker context (some browsers don't support SVG in createImageBitmap in workers yet)
      const req = await fetch(url);
      const svgBlob = await req.blob();
      const bitmap = await createImageBitmap(svgBlob);
      return bitmap;
    } else {
      // In Main thread
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const bitmap = await createImageBitmap(img);
            resolve(bitmap);
          } catch (e) {
            reject(new Error('Fallo al crear bitmap del SVG.'));
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Error al cargar la imagen SVG. Contenido posiblemente malicioso o corrupto.'));
        };
        img.src = url;
      });
    }
  } catch (error) {
    URL.revokeObjectURL(url);
    throw new Error('No se pudo decodificar el SVG: ' + error.message);
  }
}
