export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info'
};

export function showToast(message, type = ToastType.INFO) {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === ToastType.ERROR ? 'alert' : 'status');
  toast.setAttribute('aria-live', 'polite');
  
  let icon = '';
  if (type === ToastType.ERROR) {
    icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else if (type === ToastType.SUCCESS) {
    icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  }
  
  toast.innerHTML = `
    ${icon}
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger reflow for animation
  void toast.offsetWidth;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300); // match CSS transition duration
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}
