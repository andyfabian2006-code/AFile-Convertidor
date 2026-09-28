// src/js/converters/encoders/bmp-encoder.js

export async function encode(imageDataOrCanvas, format, options = {}) {
  // Extract ImageData
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
  
  // Create 32-bit BMP (supports alpha channel)
  const headerSize = 54;
  const rowSize = width * 4;
  const dataSize = rowSize * height;
  const fileSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // BITMAPFILEHEADER
  view.setUint8(0, 0x42); // B
  view.setUint8(1, 0x4D); // M
  view.setUint32(2, fileSize, true); // File size
  view.setUint32(6, 0, true); // Reserved
  view.setUint32(10, headerSize, true); // Data offset
  
  // BITMAPINFOHEADER
  view.setUint32(14, 40, true); // Info header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, -height, true); // Height (negative for top-down)
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 32, true); // Bits per pixel (32 for RGBA)
  view.setUint32(30, 0, true); // Compression (0 = none)
  view.setUint32(34, dataSize, true); // Image data size
  view.setInt32(38, 2835, true); // X pixels per meter (~72 DPI)
  view.setInt32(42, 2835, true); // Y pixels per meter
  view.setUint32(46, 0, true); // Colors used
  view.setUint32(50, 0, true); // Important colors
  
  // Pixel Data (BGRA)
  const pixelView = new Uint8Array(buffer, headerSize);
  for (let i = 0; i < data.length; i += 4) {
    pixelView[i] = data[i + 2];     // B
    pixelView[i + 1] = data[i + 1]; // G
    pixelView[i + 2] = data[i];     // R
    pixelView[i + 3] = data[i + 3]; // A
  }
  
  return new Blob([buffer], { type: 'image/bmp' });
}
