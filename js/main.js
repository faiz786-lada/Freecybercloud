/**
 * App entry point — one-time global bindings that don't belong to
 * any single feature module (modal backdrop clicks, saved theme).
 * Runs after all other modules have defined their globals.
 */

// Close modals when clicking their backdrop
document.getElementById('preview-overlay').addEventListener('click', e => {
  if (e.target.id === 'preview-overlay') UI.hide('preview-overlay');
});
document.getElementById('confirm-overlay').addEventListener('click', e => {
  if (e.target.id === 'confirm-overlay') UI.closeConfirm();
});
document.getElementById('folder-overlay').addEventListener('click', e => {
  if (e.target.id === 'folder-overlay') UI.hide('folder-overlay');
});

// Restore saved theme preference
if (localStorage.getItem?.('cc-theme') === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}
