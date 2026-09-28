import '@fontsource/syne/600.css';
import '@fontsource/syne/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';

import '../css/theme.css';
import '../css/base.css';
import '../css/layout.css';
import '../css/components.css';
import '../css/utilities.css';
import '../css/toasts.css';
import '../css/banner.css';

import { initTheme } from './ui/theme.js';
import { initDropzone } from './ui/dropzone.js';
import { initBanner } from './ui/banner.js';
import { initReportWidget } from './ui/report.js';
import { initAnalytics } from './core/analytics.js';
import { CONFIG } from './core/config.js';

// Actualizar nombre de marca en el DOM
document.querySelectorAll('.brand-name').forEach(el => {
  el.textContent = CONFIG.BRAND_NAME || CONFIG.brandName;
});

// Inicializar módulos
initTheme();
initDropzone();
initAnalytics();
initBanner();
initReportWidget();
