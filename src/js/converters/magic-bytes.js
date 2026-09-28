// src/js/converters/magic-bytes.js

const MAGIC_BYTES = {
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  JPEG: [
    [0xff, 0xd8, 0xff, 0xdb],
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xee] // EXIF
  ],
  WEBP: { offset: 8, signature: [0x57, 0x45, 0x42, 0x50] }, // 'WEBP'
  GIF: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  BMP: [0x42, 0x4d], // BM
  ICO: [0x00, 0x00, 0x01, 0x00],
  TIFF: [
    [0x49, 0x49, 0x2a, 0x00], // Little endian
    [0x4d, 0x4d, 0x00, 0x2a]  // Big endian
  ],
  AVIF: { offset: 4, signature: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66] }, // ftypavif
  PDF: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  ZIP: [0x50, 0x4b, 0x03, 0x04] // ZIP (docx, xlsx, pptx)
};

/**
 * Detecta el tipo de archivo leyendo los primeros bytes
 * @param {File|Blob} file 
 * @returns {Promise<string|null>} Formato detectado (ej: 'PNG') o null si no se reconoce
 */
export async function detectFormat(file) {
  // Read first 16 bytes for checking signatures
  const headerBlob = file.slice(0, 16);
  const buffer = await headerBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  if (bytes.length === 0) return null;

  const checkMatches = (sigArray, startOffset = 0) => {
    for (let i = 0; i < sigArray.length; i++) {
      if (bytes[startOffset + i] !== sigArray[i]) return false;
    }
    return true;
  };

  let detectedFormat = null;

  // Check simple signatures or arrays of signatures
  for (const [format, signatureDef] of Object.entries(MAGIC_BYTES)) {
    if (Array.isArray(signatureDef)) {
      if (Array.isArray(signatureDef[0])) {
        // Multiple valid signatures
        for (const sig of signatureDef) {
          if (checkMatches(sig)) detectedFormat = format === 'JPEG' ? 'JPG' : format;
        }
      } else {
        // Single simple signature
        if (checkMatches(signatureDef)) detectedFormat = format === 'JPEG' ? 'JPG' : format;
      }
    } else if (signatureDef.offset !== undefined) {
      // Signature with offset
      if (checkMatches(signatureDef.signature, signatureDef.offset)) {
        detectedFormat = format;
      }
    }
    if (detectedFormat) break;
  }

  // Resolver formatos basados en ZIP (Documentos de Office)
  if (detectedFormat === 'ZIP' && file.name) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'docx') return 'DOCX';
    if (ext === 'xlsx') return 'XLSX';
    if (ext === 'pptx') return 'PPTX';
    return null; // Si es un zip pero no de office, no lo soportamos
  }

  if (detectedFormat) return detectedFormat;

  // Comprobar SVG (texto XML) y CSV
  try {
    const textStart = await file.slice(0, 512).text();
    if (textStart.includes('<svg') || textStart.includes('<?xml')) {
      return 'SVG';
    }
    
    // Si no es SVG y la extensión es CSV, confiamos en la extensión ya que CSV no tiene magic bytes
    if (file.name) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'csv') return 'CSV';
    }
  } catch (e) {
    // Ignorar si falla al decodificar texto
  }

  return null;
}
