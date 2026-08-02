import './tokens/tokens.css';
import './style.css';
import './components/index.css';
import './components/nav.js';
import './components/form.js';

const year = document.querySelector('#year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}
