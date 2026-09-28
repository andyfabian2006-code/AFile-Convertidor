// src/js/converters/registry.js

/**
 * Registro dinámico de decodificadores y codificadores.
 * Una conversión válida existe si el formato está en Decoders, la salida en Encoders, y entrada != salida.
 */

export const FORMAT_INFO = {
  // Imágenes
  PNG:  { type: 'image', mime: 'image/png', ext: 'png', supportsAlpha: true, supportsQuality: false },
  JPG:  { type: 'image', mime: 'image/jpeg', ext: 'jpg', supportsAlpha: false, supportsQuality: true },
  WEBP: { type: 'image', mime: 'image/webp', ext: 'webp', supportsAlpha: true, supportsQuality: true },
  GIF:  { type: 'image', mime: 'image/gif', ext: 'gif', supportsAlpha: true, supportsQuality: false },
  BMP:  { type: 'image', mime: 'image/bmp', ext: 'bmp', supportsAlpha: false, supportsQuality: false },
  ICO:  { type: 'image', mime: 'image/x-icon', ext: 'ico', supportsAlpha: true, supportsQuality: false },
  TIFF: { type: 'image', mime: 'image/tiff', ext: 'tiff', supportsAlpha: true, supportsQuality: false },
  SVG:  { type: 'image', mime: 'image/svg+xml', ext: 'svg', supportsAlpha: true, supportsQuality: false },
  AVIF: { type: 'image', mime: 'image/avif', ext: 'avif', supportsAlpha: true, supportsQuality: true },
  
  // Documentos (Procesados en CloudConvert)
  PDF:  { type: 'document', mime: 'application/pdf', ext: 'pdf' },
  DOCX: { type: 'document', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
  XLSX: { type: 'document', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
  PPTX: { type: 'document', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' },
  CSV:  { type: 'document', mime: 'text/csv', ext: 'csv' },
};

// Modulos importados perezosamente
export const Decoders = {
  PNG: () => import('./decoders/native-decoder.js'),
  JPG: () => import('./decoders/native-decoder.js'),
  WEBP: () => import('./decoders/native-decoder.js'),
  GIF: () => import('./decoders/native-decoder.js'),
  BMP: () => import('./decoders/native-decoder.js'),
  ICO: () => import('./decoders/native-decoder.js'),
  AVIF: () => import('./decoders/native-decoder.js'),
  SVG: () => import('./decoders/svg-decoder.js'),
  TIFF: () => import('./decoders/tiff-decoder.js'),
};

export const Encoders = {
  PNG: () => import('./encoders/native-encoder.js'),
  JPG: () => import('./encoders/native-encoder.js'),
  WEBP: () => import('./encoders/native-encoder.js'),
  AVIF: () => import('./encoders/native-encoder.js'),
  BMP: () => import('./encoders/bmp-encoder.js'),
  ICO: () => import('./encoders/ico-encoder.js'),
  GIF: () => import('./encoders/gif-encoder.js'),
};

// Mapa estricto de conversiones permitidas por CloudConvert para documentos
export const DocumentConversions = {
  PDF: ['DOCX', 'XLSX', 'PPTX'], // Removido PNG, JPG para separar estrictamente
  DOCX: ['PDF'],
  XLSX: ['PDF', 'CSV'],
  PPTX: ['PDF'],
  CSV: ['XLSX', 'PDF']
};

/**
 * Retorna lista de formatos de salida posibles desde un formato de entrada.
 */
export function getAvailableOutputs(inputFormat) {
  const info = FORMAT_INFO[inputFormat];
  if (!info) return [];
  
  let outputs = [];
  
  if (info.type === 'image' && Decoders[inputFormat]) {
    outputs = Object.keys(Encoders).filter(out => out !== inputFormat);
    // Ya no añadimos PDF para imágenes
  } else if (info.type === 'document' && DocumentConversions[inputFormat]) {
    outputs = DocumentConversions[inputFormat];
  }
  
  // Mover formatos populares al inicio
  const popular = ['JPG', 'PNG', 'WEBP', 'PDF', 'DOCX'];
  outputs.sort((a, b) => {
    const idxA = popular.indexOf(a);
    const idxB = popular.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  
  return outputs;
}

export function generateConversionId(inputFormat, outputFormat) {
  return `${inputFormat.toLowerCase()}-to-${outputFormat.toLowerCase()}`;
}
