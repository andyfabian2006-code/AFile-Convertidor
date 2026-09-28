import { detectFormat } from '../converters/magic-bytes.js';
import { getAvailableOutputs, FORMAT_INFO, generateConversionId } from '../converters/registry.js';
import { CONFIG } from './config.js';
import { registrarConversion } from './stats.js';

/**
 * Clase principal que orquesta la conversión
 */
export class ConverterOrchestrator {
  constructor() {
    this.worker = null;
    this.initWorker();
  }

  initWorker() {
    if (typeof window !== 'undefined' && window.Worker) {
      this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
  }

  async validateFile(file) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`El archivo supera el límite de ${CONFIG.MAX_FILE_SIZE / (1024*1024)}MB.`);
    }

    const format = await detectFormat(file);
    if (!format || !CONFIG.ACCEPTED_FORMATS.includes(format)) {
      throw new Error('Formato no soportado o archivo corrupto.');
    }

    return format;
  }

  async convert(file, targetFormat, options = {}, onProgress = null) {
    const sourceFormat = await this.validateFile(file);
    const available = getAvailableOutputs(sourceFormat);
    
    if (!available.includes(targetFormat)) {
      throw new Error(`La conversión de ${sourceFormat} a ${targetFormat} no está soportada.`);
    }

    if (onProgress) onProgress(10); // Iniciando

    const conversionId = generateConversionId(sourceFormat, targetFormat);
    const formatInfo = FORMAT_INFO[sourceFormat];

    let resultBlob;

    if (formatInfo && formatInfo.type === 'document') {
      // PROCESAMIENTO EN LA NUBE (Documentos)
      resultBlob = await this.convertCloud(file, sourceFormat, targetFormat, onProgress);
    } else {
      // PROCESAMIENTO LOCAL (Imágenes)
      // Intenta usar el Worker
      if (this.worker && typeof OffscreenCanvas !== 'undefined') {
        resultBlob = await new Promise((resolve, reject) => {
          const handler = async (e) => {
            if (e.data.type === 'success') {
              this.worker.removeEventListener('message', handler);
              if (onProgress) onProgress(100);
              resolve({ type: 'blob', blob: e.data.blob });
            } else if (e.data.type === 'error') {
              this.worker.removeEventListener('message', handler);
              reject(new Error(e.data.error));
            } else if (e.data.type === 'progress' && onProgress) {
              onProgress(e.data.percent);
            }
          };
          this.worker.addEventListener('message', handler);
          this.worker.postMessage({ file, sourceFormat, targetFormat, options });
        });
      } else {
        // Fallback main thread
        const blob = await this.convertMainThread(file, sourceFormat, targetFormat, options, onProgress);
        resultBlob = { type: 'blob', blob };
      }
    }

    await registrarConversion(conversionId);
    return resultBlob;
  }

  async convertCloud(file, sourceFormat, targetFormat, onProgress) {
    if (onProgress) onProgress(20); // Iniciando en la nube

    // 1. Crear Job en CloudConvert
    const createRes = await fetch('/.netlify/functions/cloudconvert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-job',
        inputFormat: sourceFormat,
        outputFormat: targetFormat,
        fileName: file.name || `archivo.${sourceFormat.toLowerCase()}`
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || 'Error contactando con CloudConvert');

    // 2. Subir el archivo al presigned URL de CloudConvert
    const formData = new FormData();
    for (const [key, value] of Object.entries(createData.uploadParameters)) {
      formData.append(key, value);
    }
    formData.append('file', file, file.name || `archivo.${sourceFormat.toLowerCase()}`);

    const uploadRes = await fetch(createData.uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Error subiendo el documento a la nube');

    if (onProgress) onProgress(50); // Procesando en la nube...

    // 3. Polling del estado del Job
    const jobId = createData.jobId;
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const statusRes = await fetch('/.netlify/functions/cloudconvert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check-status', jobId })
          });
          const statusData = await statusRes.json();
          
          if (!statusRes.ok) throw new Error(statusData.error || 'Error verificando estado');

          if (statusData.status === 'finished') {
            if (onProgress) onProgress(100); // Listo
            
            // Devolver la URL de descarga provista por CloudConvert
            resolve({ type: 'url', url: statusData.downloadUrl });
          } else if (statusData.status === 'error') {
            reject(new Error(statusData.message || 'La conversión en la nube falló.'));
          } else {
            // Seguir esperando (waiting, processing)
            setTimeout(poll, 2000);
          }
        } catch (e) {
          reject(e);
        }
      };
      
      setTimeout(poll, 2000); // Empezar a hacer polling después de 2 segundos
    });
  }

  async convertMainThread(file, sourceFormat, targetFormat, options, onProgress) {
    if (onProgress) onProgress(30); // Decodificando
    
    const registry = await import('../converters/registry.js');
    
    const decoderModule = await registry.Decoders[sourceFormat]();
    const bitmap = await decoderModule.decode(file, options);
    
    // Check dimensions
    if (bitmap.width > CONFIG.MAX_DIMENSIONS.side || bitmap.height > CONFIG.MAX_DIMENSIONS.side) {
      throw new Error(`Dimensiones excesivas. Máximo permitido: ${CONFIG.MAX_DIMENSIONS.side}px de lado.`);
    }
    
    if (onProgress) onProgress(70); // Codificando

    const encoderModule = await registry.Encoders[targetFormat]();
    const resultBlob = await encoderModule.encode(bitmap, targetFormat, options);
    
    if (onProgress) onProgress(100); // Completado
    return resultBlob;
  }
}

export const converter = new ConverterOrchestrator();
