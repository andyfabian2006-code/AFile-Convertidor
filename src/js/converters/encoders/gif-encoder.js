// src/js/converters/encoders/gif-encoder.js
import { GifWriter } from 'omggif';

export async function encode(imageDataOrCanvas, format, options = {}) {
  let imageData;
  if (imageDataOrCanvas instanceof ImageData) {
    imageData = imageDataOrCanvas;
  } else {
    let ctx = imageDataOrCanvas.getContext('2d');
    imageData = ctx.getImageData(0, 0, imageDataOrCanvas.width, imageDataOrCanvas.height);
  }

  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Allocate buffer (width * height * 5 is usually safe enough for 1 frame)
  const buf = new Uint8Array(width * height * 5 + 1024);
  const writer = new GifWriter(buf, width, height, { loop: 0 });
  
  // Basic quantization for a single frame GIF (using fixed palette for speed in this basic version, 
  // or simple 256-color reduction). For production, a proper color quantizer (like NeuQuant) is needed.
  // Since omggif requires a palette and indexed pixels, we do a very naive 2-1-1 RGB split (or similar).
  
  const palette = [];
  const pixels = new Uint8Array(width * height);
  const colorMap = new Map();
  
  let pIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Quantize 24-bit to 8-bit to fit in 256 colors
    const r = Math.round(data[i] / 51) * 51;
    const g = Math.round(data[i+1] / 51) * 51;
    const b = Math.round(data[i+2] / 51) * 51;
    const a = data[i+3];
    
    if (a < 128) {
      // Transparent pixel
      pixels[i/4] = 0;
      if (palette.length === 0) palette.push(0x000000); // 0 index for transparent
    } else {
      const hex = (r << 16) | (g << 8) | b;
      let idx = colorMap.get(hex);
      if (idx === undefined) {
        if (palette.length < 256) {
          idx = palette.length;
          palette.push(hex);
          colorMap.set(hex, idx);
        } else {
          idx = 1; // Fallback index if too many colors (naive)
        }
      }
      pixels[i/4] = idx;
    }
  }
  
  // Make sure palette has at least 2 entries
  while (palette.length < 2) palette.push(0);

  // Write frame
  writer.addFrame(0, 0, width, height, pixels, { palette, transparent: 0 });
  
  // Slice to actual written bytes
  const finalBuf = buf.slice(0, writer.end());
  return new Blob([finalBuf], { type: 'image/gif' });
}
