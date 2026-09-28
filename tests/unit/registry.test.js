import { describe, it, expect } from 'vitest';
import { getAvailableOutputs, generateConversionId } from '../../src/js/converters/registry.js';

describe('Converter Registry', () => {
  it('should return correct outputs for PNG', () => {
    const outputs = getAvailableOutputs('PNG');
    expect(outputs).toContain('JPG');
    expect(outputs).toContain('WEBP');
    expect(outputs).toContain('BMP');
    expect(outputs).not.toContain('PNG'); // No self conversion
  });

  it('should return empty for unknown input', () => {
    const outputs = getAvailableOutputs('UNKNOWN');
    expect(outputs).toEqual([]);
  });

  it('should format conversion IDs correctly', () => {
    expect(generateConversionId('PNG', 'JPG')).toBe('png-to-jpg');
    expect(generateConversionId('SVG', 'WEBP')).toBe('svg-to-webp');
  });
});
