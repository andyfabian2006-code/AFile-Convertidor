import { consentManager } from '../consent/consentManager.js';

export function initBanner() {
  // Si ya respondió, no mostramos el banner a menos que quieran configurarlo
  if (consentManager.hasResponded()) {
    setupConfigButton();
    return;
  }

  renderBanner();
}

function renderBanner() {
  const bannerHTML = `
    <div id="cookie-banner" class="cookie-banner" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-desc">
      <div class="cookie-content">
        <h3 id="cookie-title" class="mt-0 mb-xs">Respetamos tu privacidad</h3>
        <p id="cookie-desc" class="text-sm mt-0 text-sec">
          AFile es una herramienta 100% local. Sin embargo, usamos cookies de terceros para mostrar anuncios (AdSense) y analizar tráfico (PostHog). ¿Nos das tu permiso para usarlas?
        </p>
      </div>
      <div class="cookie-actions flex gap-sm">
        <button id="btn-reject-cookies" class="btn btn-outline text-sm">Rechazar</button>
        <button id="btn-accept-cookies" class="btn btn-primary text-sm">Aceptar</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', bannerHTML);

  const banner = document.getElementById('cookie-banner');
  const btnAccept = document.getElementById('btn-accept-cookies');
  const btnReject = document.getElementById('btn-reject-cookies');

  btnAccept.addEventListener('click', () => {
    consentManager.acceptAll();
    closeBanner(banner);
  });

  btnReject.addEventListener('click', () => {
    consentManager.rejectAll();
    closeBanner(banner);
  });

  setupConfigButton();
}

function closeBanner(bannerElement) {
  bannerElement.style.opacity = '0';
  setTimeout(() => bannerElement.remove(), 300);
}

function setupConfigButton() {
  const configBtn = document.getElementById('config-cookies');
  if (configBtn) {
    configBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Resetear estado para mostrar el banner de nuevo
      localStorage.removeItem('afile_cookie_consent');
      consentManager.status = null;
      renderBanner();
    });
  }
}
