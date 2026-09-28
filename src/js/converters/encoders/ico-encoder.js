// src/js/converters/encoders/ico-encoder.js
import { encode as encodePNG } from './native-encoder.js';

/**
 * Codificador de archivos ICO.
 * Empaqueta un PNG dentro de un contenedor ICO.
 * Options puede contener 'sizes' (ej: [256])
 */
export async function encode(imageDataOrCanvas, format, options = {}) {
  // Use 256x256 as default for modern ICO if not specified
  // We'll generate a single PNG and wrap it in the ICO header.
  
  const targetSize = options.size || 256;
  
  // Resize to square targetSize if needed
  let canvas = imageDataOrCanvas;
  const isOffscreen = typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
  const isHTMLCanvas = typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement;
  
  if (!isOffscreen && !isHTMLCanvas) {
    // If it's ImageBitmap or ImageData, make it a canvas
    const off = typeof OffscreenCanvas !== 'undefined' 
      ? new OffscreenCanvas(targetSize, targetSize) 
      : document.createElement('canvas');
    if (off.width !== targetSize) {
      off.width = targetSize;
      off.height = targetSize;
    }
    const ctx = off.getContext('2d');
    
    // Draw centered/scaled (for simplicity, just draw scaled to fit)
    ctx.drawImage(imageDataOrCanvas, 0, 0, targetSize, targetSize);
    canvas = off;
  } else if (canvas.width !== targetSize || canvas.height !== targetSize) {
    const off = typeof OffscreenCanvas !== 'undefined' 
      ? new OffscreenCanvas(targetSize, targetSize) 
      : document.createElement('canvas');
    off.width = targetSize;
    off.height = targetSize;
    const ctx = off.getContext('2d');
    ctx.drawImage(canvas, 0, 0, targetSize, targetSize);
    canvas = off;
  }
  
  // Get PNG blob
  const pngBlob = await encodePNG(canvas, 'PNG');
  const pngBuffer = await pngBlob.arrayBuffer();
  
  // ICO Header (6 bytes) + ICONDIRENTRY (16 bytes) + PNG Data
  const icoSize = 6 + 16 + pngBuffer.byteLength;
  const buffer = new ArrayBuffer(icoSize);
  const view = new DataView(buffer);
  
  // ICONDIR
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Image type (1 = ICO)
  view.setUint16(4, 1, true); // Number of images
  
  // ICONDIRENTRY
  let w = targetSize >= 256 ? 0 : targetSize;
  let h = targetSize >= 256 ? 0 : targetSize;
  view.setUint8(6, w); // Width
  view.setUint8(7, h); // Height
  view.setUint8(8, 0); // Color palette
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // Bits per pixel
  view.setUint32(14, pngBuffer.byteLength, true); // Size of image data
  view.setUint32(18, 22, true); // Offset of image data
  
  // Copy PNG data
  const destView = new Uint8Array(buffer, 22);
  const srcView = new Uint8Array(pngBuffer);
  destView.set(srcView);
  
  return new Blob([buffer], { type: 'image/x-icon' });
}
