import { showToast } from './toasts.js';

export function initReportWidget() {
  const fab = document.getElementById('report-fab');
  const modal = document.getElementById('report-modal');
  const closeBtn = document.getElementById('close-report');
  const form = document.getElementById('report-form');
  const submitBtn = document.getElementById('btn-submit-report');
  const btnText = submitBtn.querySelector('span');

  if (!fab || !modal || !closeBtn || !form) return;

  const openModal = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Evitar scroll
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = ''; // Restaurar scroll
    form.reset(); // Limpiar form al cerrar
  };

  // Event Listeners
  fab.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // Cerrar al hacer clic fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Manejo del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('report-email').value;
    const message = document.getElementById('report-message').value;

    if (!message.trim()) {
      showToast('Por favor escribe un mensaje', 'error');
      return;
    }

    try {
      // Estado de carga
      submitBtn.disabled = true;
      btnText.textContent = 'Enviando...';
      
      const response = await fetch('/.netlify/functions/report-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar reporte');
      }

      showToast('¡Reporte enviado! Gracias por tu ayuda.', 'success');
      closeModal();
      
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      showToast('No se pudo enviar el reporte. Intenta luego.', 'error');
    } finally {
      // Restaurar estado
      submitBtn.disabled = false;
      btnText.textContent = 'Enviar Reporte';
    }
  });
}
