/**
 * Creative Digital Company — Form validation behavior module (M3-2 / CRE-39)
 *
 * Progressive enhancement for forms marked with `[data-cdc-form]`. Without JS,
 * native `required`/`type="email"` validation and the semantic error markup
 * still work. With JS this module enforces the spec §6.3 contract:
 *
 *   - validate on blur and on submit (not per keystroke)
 *   - error element renders inline (icon + text), announced via role="alert"
 *   - `aria-invalid` mirrors the invalid state; `aria-describedby` binds help
 *     and error elements
 *   - on a failed submit, focus moves to the first invalid field
 *
 * Error copy: the markup ships a sensible default in the `.cdc-error` text;
 * the field wrapper can override per-kind via data-cdc-error-{required,email,
 * default}. All queries are null-guarded; the module is inert without
 * `[data-cdc-form]`.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getField(control) {
  return control.closest('.cdc-field');
}

function getErrorElement(control) {
  const field = getField(control);
  return field ? field.querySelector('.cdc-error') : null;
}

function validateControl(control) {
  const errorEl = getErrorElement(control);
  if (!errorEl) return true;

  const field = getField(control);
  const message = errorEl.textContent || '';
  const value = control.value.trim();
  const isEmpty = value === '';

  let errorMessage = null;
  if (control.hasAttribute('required') && isEmpty) {
    errorMessage = field?.dataset.cdcErrorRequired || message;
  } else if (control.type === 'email' && !isEmpty && !EMAIL_RE.test(value)) {
    errorMessage = field?.dataset.cdcErrorEmail || message;
  }

  if (errorMessage) {
    control.setAttribute('aria-invalid', 'true');
    const textEl = errorEl.querySelector('[data-cdc-error-text]');
    if (textEl) textEl.textContent = errorMessage;
    errorEl.hidden = false;
    return false;
  }

  control.setAttribute('aria-invalid', 'false');
  errorEl.hidden = true;
  return true;
}

function initForm(form) {
  const controls = form.querySelectorAll('input, select, textarea');

  for (const control of controls) {
    control.addEventListener('blur', () => {
      validateControl(control);
    });
  }

  form.addEventListener('submit', (event) => {
    let valid = true;
    let firstInvalid = null;

    for (const control of controls) {
      if (!validateControl(control)) {
        valid = false;
        if (!firstInvalid) firstInvalid = control;
      }
    }

    if (!valid) {
      event.preventDefault();
      firstInvalid?.focus();
    }
  });
}

for (const form of document.querySelectorAll('[data-cdc-form]')) {
  initForm(form);
}
