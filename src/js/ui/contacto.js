import { initTheme } from './theme.js';
import { CONFIG } from '../core/config.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Set brand name dynamically
  document.querySelectorAll('.brand-name').forEach(el => el.textContent = CONFIG.brandName);

  const form = document.getElementById('contact-form');
  const alertBox = document.getElementById('contact-alert');
  const submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Validar Turnstile
      if (!data['cf-turnstile-response']) {
        showAlert('Por favor, completa la verificación de seguridad.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      alertBox.classList.add('hidden');

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          showAlert('¡Mensaje enviado con éxito!', 'success');
          form.reset();
          // Reset Turnstile (necesita estar disponible en window)
          if (window.turnstile) {
            window.turnstile.reset();
          }
        } else {
          showAlert(result.error || 'Ocurrió un error al enviar el mensaje.', 'error');
        }
      } catch (error) {
        showAlert('Ocurrió un error de conexión.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Mensaje';
      }
    });
  }

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `mt-sm p-sm rounded-md ${
      type === 'success' 
        ? 'bg-green-100 text-green-800 border border-green-300' 
        : 'bg-red-100 text-red-800 border border-red-300'
    }`;
    // Usar estilos base si no hay tailwind, pero asumimos clases de color similares o usar estilo inline
    if (type === 'success') {
      alertBox.style.color = 'var(--color-success-border, #16a34a)';
    } else {
      alertBox.style.color = 'var(--color-error-border, #dc2626)';
    }
    alertBox.classList.remove('hidden');
  }
});
