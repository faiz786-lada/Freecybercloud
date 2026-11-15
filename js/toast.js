/**
 * Lightweight toast notifications.
 * toast(message, type) where type is 'info' | 'success' | 'error'
 */
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
