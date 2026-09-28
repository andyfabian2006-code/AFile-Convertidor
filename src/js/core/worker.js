import { Decoders, Encoders } from '../converters/registry.js';
import { CONFIG } from './config.js';

self.onmessage = async (e) => {
  const { file, sourceFormat, targetFormat, options } = e.data;
  
  try {
    self.postMessage({ type: 'progress', percent: 30 });
    
    // Load Decoder dynamically
    const decoderLoader = Decoders[sourceFormat];
    if (!decoderLoader) throw new Error(`Decoder no encontrado para ${sourceFormat}`);
    const decoderModule = await decoderLoader();
    
    const bitmap = await decoderModule.decode(file, options);

    // Dimension check
    if (bitmap.width > CONFIG.MAX_DIMENSIONS.side || bitmap.height > CONFIG.MAX_DIMENSIONS.side) {
      throw new Error(`Dimensiones excesivas. Máximo permitido: ${CONFIG.MAX_DIMENSIONS.side}px.`);
    }

    self.postMessage({ type: 'progress', percent: 70 });
    
    // Load Encoder dynamically
    const encoderLoader = Encoders[targetFormat];
    if (!encoderLoader) throw new Error(`Encoder no encontrado para ${targetFormat}`);
    const encoderModule = await encoderLoader();
    
    const blob = await encoderModule.encode(bitmap, targetFormat, options);
    
    self.postMessage({ type: 'success', blob });
    
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};
