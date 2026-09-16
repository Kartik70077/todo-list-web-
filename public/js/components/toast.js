/**
 * TaskFlow Pro - Toast Notification Component
 */

const Toast = (function () {
  const container = document.getElementById('toastContainer');

  function show(message, type = 'info', duration = 3500) {
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'warning') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  return {
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    info: (msg, dur) => show(msg, 'info', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
  };
})();
