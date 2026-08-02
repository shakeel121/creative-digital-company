/**
 * Creative Digital Company — Design guidelines page entry (M3-3 / CRE-35)
 *
 * Loads the exact same asset chain as the site entry (tokens -> global styles
 * -> component library) plus the guidelines page stylesheet, so the page is a
 * living reference of the design system documented in src/brand/brand-identity.md.
 */

import './tokens/tokens.css';
import './style.css';
import './components/index.css';
import './design-guidelines.css';
import './components/nav.js';

const year = document.querySelector('#year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}
