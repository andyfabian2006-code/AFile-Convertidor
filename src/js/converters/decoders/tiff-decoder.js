// src/js/converters/decoders/tiff-decoder.js
import UTIF from 'utif';

/**
 * Decodificador TIFF usando UTIF.js
 */
export async function decode(blob, options = {}) {
  const buffer = await blob.arrayBuffer();
  
  try {
    const ifds = UTIF.decode(buffer);
    if (!ifds || ifds.length === 0) {
      throw new Error('TIFF inválido o vacío.');
    }
    
    const page = ifds[0];
    UTIF.decodeImage(buffer, page);
    
    const rgba = UTIF.toRGBA8(page); // Uint8Array [r,g,b,a, r,g,b,a...]
    const width = page.width;
    const height = page.height;

    // Convert to ImageData
    const imgData = new ImageData(new Uint8ClampedArray(rgba), width, height);
    
    // Create ImageBitmap from ImageData
    const bitmap = await createImageBitmap(imgData);
    return bitmap;
  } catch (error) {
    throw new Error('No se pudo decodificar el TIFF: ' + error.message);
  }
}
