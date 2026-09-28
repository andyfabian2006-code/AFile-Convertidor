// src/js/converters/decoders/native-decoder.js

/**
 * Decodificador nativo usando createImageBitmap.
 * Soporta PNG, JPG, WEBP, GIF (1er frame), BMP, ICO, AVIF.
 */
export async function decode(blob, options = {}) {
  // createImageBitmap natively applies EXIF orientation when options object is omitted
  // or specifically requested in some browser versions, but default is usually 'from-image' now.
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    return bitmap; // Returns an ImageBitmap
  } catch (error) {
    throw new Error('No se pudo decodificar la imagen nativa: ' + error.message);
  }
}
