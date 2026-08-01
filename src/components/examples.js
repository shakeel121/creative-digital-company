/**
 * Creative Digital Company — Component library usage examples (M3-2 / CRE-39)
 *
 * Entry module for examples.html. Loads the exact same asset chain as the app
 * entry (tokens -> global styles -> component library) plus the interactive
 * behavior modules, so the examples page is a faithful usage reference for the
 * M3-2.4 adoption task (CRE-41).
 */

import '../tokens/tokens.css';
import '../style.css';
import './index.css';
import './nav.js';
import './form.js';

const year = document.querySelector('#year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}
