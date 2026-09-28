import { CONFIG } from '../core/config.js';
import { getAvailableOutputs } from '../converters/registry.js';
import { converter } from '../core/converter.js';
import { showToast, ToastType } from './toasts.js';

export function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const input = document.getElementById('file-input');
  
  const elEmpty = document.getElementById('dz-empty');
  const elLoaded = document.getElementById('dz-loaded');
  const elProcessing = document.getElementById('dz-processing');
  const elDone = document.getElementById('dz-done');
  const elError = document.getElementById('dz-error');
  
  const filenameDisplay = document.getElementById('dz-filename');
  const filedetailsDisplay = document.getElementById('dz-file-details');
  const limitsText = document.getElementById('dz-limits-text');
  const btnConvert = document.getElementById('convert-btn');
  const selectFormat = document.getElementById('format-select');
  const progressText = document.getElementById('dz-progress-text');
  const downloadBtn = document.getElementById('download-btn');

  if (!dropzone || !input) return;

  // Set limits text
  const mb = Math.round(CONFIG.MAX_FILE_SIZE / (1024 * 1024));
  limitsText.textContent = `${CONFIG.ACCEPTED_FORMATS.join(', ')} hasta ${mb}MB`;

  let currentFile = null;
  let currentFormat = null;

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const setState = (state, data = {}) => {
    [elEmpty, elLoaded, elProcessing, elDone, elError].forEach(el => el.classList.add('hidden'));
    
    // Default disabled state
    btnConvert.disabled = true;
    btnConvert.setAttribute('aria-disabled', 'true');
    selectFormat.disabled = true;

    if (state === 'empty') {
      elEmpty.classList.remove('hidden');
      selectFormat.innerHTML = '<option value="">Esperando archivo...</option>';
    } else if (state === 'loaded') {
      elLoaded.classList.remove('hidden');
      filenameDisplay.textContent = data.name;
      filedetailsDisplay.textContent = `Detectado: ${data.format} · ${formatSize(data.size)}`;
      
      // Populate select
      const available = getAvailableOutputs(data.format);
      if (available.length > 0) {
        selectFormat.innerHTML = available.map(f => `<option value="${f}">${f}</option>`).join('');
        selectFormat.disabled = false;
        btnConvert.disabled = false;
        btnConvert.setAttribute('aria-disabled', 'false');
      } else {
        selectFormat.innerHTML = '<option value="">Sin formatos de salida disponibles</option>';
      }
    } else if (state === 'processing') {
      elProcessing.classList.remove('hidden');
      progressText.textContent = '0%';
    } else if (state === 'done') {
      elDone.classList.remove('hidden');
      
      // Set download link
      const newName = data.originalName.replace(/\.[^/.]+$/, "") + '.' + data.outputFormat.toLowerCase();
      downloadBtn.href = data.url;
      downloadBtn.download = newName;
      
      // Forzar descarga automática
      downloadBtn.click();
      
      showToast('¡Archivo convertido con éxito!', ToastType.SUCCESS);
    } else if (state === 'error') {
      elError.classList.remove('hidden');
      document.getElementById('dz-error-msg').textContent = data.msg;
      showToast('Ocurrió un error', ToastType.ERROR);
    }
  };

  const handleFile = async (file) => {
    if (!file) {
      currentFile = null;
      setState('empty');
      return;
    }
    
    try {
      const format = await converter.validateFile(file);
      currentFile = file;
      currentFormat = format;
      setState('loaded', { name: file.name, size: file.size, format });
    } catch (e) {
      currentFile = null;
      setState('error', { msg: e.message });
    }
  };

  btnConvert.addEventListener('click', async () => {
    if (!currentFile) return;
    
    const targetFormat = selectFormat.value;
    setState('processing');
    
    try {
      const result = await converter.convert(currentFile, targetFormat, {}, (percent) => {
        progressText.textContent = `${percent}%`;
      });
      
      const url = result.type === 'blob' ? URL.createObjectURL(result.blob) : result.url;
      setState('done', { url, originalName: currentFile.name, outputFormat: targetFormat });
      
    } catch (e) {
      setState('error', { msg: 'Fallo al convertir: ' + e.message });
    }
  });

  // Eventos de Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFile(files[0]);
  });

  input.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
  });
}
