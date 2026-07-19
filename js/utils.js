export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn" aria-label="Close message">&times;</button>
  `;

  container.appendChild(toast);

  toast.querySelector('.toast-close-btn').addEventListener('click', () => {
    removeToast(toast);
  });

  const autoTimeout = setTimeout(() => {
    removeToast(toast);
  }, duration);

  toast.dataset.timeoutId = autoTimeout;
}

function removeToast(toast) {
  if (toast.dataset.timeoutId) {
    clearTimeout(toast.dataset.timeoutId);
  }
  toast.classList.add('fade-out');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}
