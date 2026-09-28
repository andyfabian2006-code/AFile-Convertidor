import { describe, it, expect } from 'vitest';
import * as bmpEncoder from '../../src/js/converters/encoders/bmp-encoder.js';
import * as icoEncoder from '../../src/js/converters/encoders/ico-encoder.js';

// Mock ImageData and document for Node.js environment
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

if (typeof global.document === 'undefined') {
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({
            drawImage: () => {},
            getImageData: (x, y, w, h) => new global.ImageData(new Uint8ClampedArray(w * h * 4), w, h)
          }),
          toBlob: (callback, type) => {
            callback(new Blob([new Uint8Array([1, 2, 3])], { type: type || 'image/png' }));
          },
          convertToBlob: async (options) => {
            return new Blob([new Uint8Array([1, 2, 3])], { type: options?.type || 'image/png' });
          },
          width: 0,
          height: 0
        };
      }
      return {};
    }
  };
}

describe('Custom Encoders', () => {
  it('BMP Encoder should produce valid BMP header', async () => {
    // Create a dummy ImageData (2x2 red image)
    const imgData = new ImageData(new Uint8ClampedArray([
      255,0,0,255, 255,0,0,255,
      255,0,0,255, 255,0,0,255
    ]), 2, 2);

    const blob = await bmpEncoder.encode(imgData, 'BMP', {});
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    
    // Check 'BM' signature
    expect(view.getUint8(0)).toBe(0x42); // 'B'
    expect(view.getUint8(1)).toBe(0x4D); // 'M'
    
    // Size should be 54 (header) + 4 pixels * 4 bytes
    expect(view.getUint32(2, true)).toBe(54 + 16);
    
    // Width and height
    expect(view.getInt32(18, true)).toBe(2);
    expect(view.getInt32(22, true)).toBe(-2); // Top-down BMPs use negative height
  });

  it('ICO Encoder should produce valid ICO header', async () => {
    const imgData = new ImageData(new Uint8ClampedArray(4 * 16 * 16), 16, 16);
    const blob = await icoEncoder.encode(imgData, 'ICO', { size: 16 });
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    
    // Check ICO signature (0x00, 0x01)
    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    
    // Number of images
    expect(view.getUint16(4, true)).toBe(1);
    
    // Width and height of first image
    expect(view.getUint8(6)).toBe(16);
    expect(view.getUint8(7)).toBe(16);
  });
});
