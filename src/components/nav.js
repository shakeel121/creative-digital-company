/**
 * Creative Digital Company — Nav behavior module (M3-2 / CRE-39)
 *
 * Progressive enhancement for the mobile nav toggle. Without JS the nav renders
 * fully open (see src/components/nav.css); this module adds a `.cdc-js` hook on
 * <html> which hides the list on mobile, then wires open/close:
 *
 *   - toggle click flips `aria-expanded` and moves focus to the first link
 *   - Esc closes and returns focus to the toggle
 *   - activating a link closes the panel
 *   - clicking outside the toggle/panel closes it
 *
 * All queries are null-guarded; this module is inert on pages without a
 * `[data-cdc-nav-toggle]` / `[data-cdc-nav-menu]` pair.
 */

document.documentElement.classList.add('cdc-js');

const toggle = document.querySelector('[data-cdc-nav-toggle]');
const menu = document.querySelector('[data-cdc-nav-menu]');

function isOpen() {
  return toggle?.getAttribute('aria-expanded') === 'true';
}

function setOpen(open) {
  toggle?.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('is-open', open);
}

function closeAndReturnFocus() {
  if (!isOpen()) return;
  setOpen(false);
  toggle?.focus();
}

toggle?.addEventListener('click', () => {
  const next = !isOpen();
  setOpen(next);
  if (next) {
    const firstLink = menu?.querySelector('a');
    firstLink?.focus();
  }
});

menu?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    setOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAndReturnFocus();
  }
});

document.addEventListener('click', (event) => {
  if (!isOpen() || !(event.target instanceof Node)) return;
  if (toggle?.contains(event.target)) return;
  if (menu?.contains(event.target)) return;
  setOpen(false);
});
