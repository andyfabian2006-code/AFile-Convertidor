import { describe, it, expect } from 'vitest';
import { detectFormat } from '../../src/js/converters/magic-bytes.js';

describe('Magic Bytes Detection', () => {
  it('should detect PNG', async () => {
    const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const blob = new Blob([pngMagic]);
    const format = await detectFormat(blob);
    expect(format).toBe('PNG');
  });

  it('should detect JPG (FF D8 FF DB)', async () => {
    const jpgMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xdb]);
    const blob = new Blob([jpgMagic]);
    const format = await detectFormat(blob);
    expect(format).toBe('JPG');
  });

  it('should detect WEBP', async () => {
    const webpMagic = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    const blob = new Blob([webpMagic]);
    const format = await detectFormat(blob);
    expect(format).toBe('WEBP');
  });

  it('should detect SVG (XML text)', async () => {
    const svgText = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const blob = new Blob([svgText]);
    const format = await detectFormat(blob);
    expect(format).toBe('SVG');
  });

  it('should return null for unknown format', async () => {
    const unknown = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const blob = new Blob([unknown]);
    const format = await detectFormat(blob);
    expect(format).toBe(null);
  });
});
