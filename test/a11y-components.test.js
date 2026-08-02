import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFileSync(p, 'utf8');

/**
 * M3-2.3 (CRE-40) — Automated accessibility verification for the component layer.
 *
 * Enforces the WCAG 2.1 AA baseline from CRE-38 §6 (component-spec) over the
 * real component usage page (examples.html). A single reusable lint engine
 * drives both the "must be clean" assertions on the shipped markup and the
 * "must be caught" regression checks against a deliberately broken fixture
 * (test/fixtures/broken-a11y.html), so a regression in any component fails CI.
 */

function parse(html) {
  return new JSDOM(html).window.document;
}

const interactiveTags = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

function lint(document) {
  const issues = [];

  const push = (selector, message) => issues.push({ selector, message });

  /* ---- global document structure ---- */
  const htmlEl = document.documentElement;
  if (!htmlEl.getAttribute('lang')) {
    push('html', 'document must declare a lang attribute');
  }
  if (document.querySelectorAll('h1').length !== 1) {
    push('h1', 'document must contain exactly one h1');
  }
  if (document.querySelector('.skip-link')) {
    const skip = document.querySelector('.skip-link');
    const target = skip.getAttribute('href');
    if (!target || !target.startsWith('#') || !document.getElementById(target.slice(1))) {
      push('.skip-link', 'skip link must point at an existing in-page target');
    }
  }

  /* ---- button component (spec §6.1) ---- */
  for (const btn of document.querySelectorAll('.cdc-button')) {
    if (!interactiveTags.has(btn.tagName)) {
      push('.cdc-button', `non-semantic interactive element <${btn.tagName}> styled as a button`);
      continue;
    }
    if (btn.tagName === 'A' && !btn.hasAttribute('href')) {
      push('.cdc-button', 'button-like link must carry href');
    }
    const text = (btn.textContent || '').trim();
    const hasSvg = !!btn.querySelector('svg');
    if (!text && hasSvg && !btn.getAttribute('aria-label')) {
      push('.cdc-button', 'icon-only button needs an aria-label (never rely on SVG alone)');
    }
    if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) {
      push('.cdc-button', 'button should declare type (button/submit)');
    }
  }

  /* ---- card component (spec §6.2) ---- */
  for (const card of document.querySelectorAll('.cdc-card--interactive')) {
    const links = card.querySelectorAll('a[href]');
    if (links.length === 0) {
      push('.cdc-card--interactive', 'interactive card must expose a real link (no click handler on the card)');
    }
    if (links.length > 1) {
      push('.cdc-card--interactive', 'interactive card should expose exactly one focusable link');
    }
  }
  for (const title of document.querySelectorAll('.cdc-card__title')) {
    if (!/^H[1-6]$/.test(title.tagName)) {
      push('.cdc-card__title', 'card title must be a real heading element');
    }
  }

  /* ---- form component (spec §6.3) ---- */
  const controls = document.querySelectorAll('input, select, textarea');
  if (controls.length > 0) {
    for (const control of controls) {
      if (control.type === 'hidden') continue;
      const label = document.querySelector(`label[for="${control.id}"]`);
      if (!control.id) {
        push(control.tagName, 'form control needs an id to be labelable');
      } else if (!label) {
        push(`#${control.id}`, `form control "${control.name || control.id}" has no associated <label for>`);
      }
      if (control.hasAttribute('aria-describedby')) {
        for (const ref of control.getAttribute('aria-describedby').split(/\s+/)) {
          if (!document.getElementById(ref)) {
            push(`#${control.id}`, `aria-describedby references missing element "#${ref}"`);
          }
        }
      }
    }
    const alerts = document.querySelectorAll('[role="alert"]');
    if (alerts.length > 0) {
      for (const alert of alerts) {
        if (!alert.id) push('[role="alert"]', 'error region must carry an id so fields can bind it');
      }
    }
    for (const form of document.querySelectorAll('form')) {
      if (!form.hasAttribute('action') && !form.hasAttribute('novalidate')) {
        push('form', 'form without action should declare novalidate when JS owns validation');
      }
    }
  }

  /* ---- nav component (spec §6.4) ---- */
  const navs = document.querySelectorAll('nav');
  if (navs.length === 0) {
    push('nav', 'page must expose at least one <nav> landmark');
  }
  const seenLabels = new Set();
  for (const nav of navs) {
    const label = nav.getAttribute('aria-label');
    if (!label) {
      push('nav', '<nav> landmarks need a distinct aria-label');
    } else if (seenLabels.has(label)) {
      push('nav', `duplicate nav aria-label "${label}" — use distinct labels for landmarks`);
    } else {
      seenLabels.add(label);
    }
  }
  const toggle = document.querySelector('.cdc-nav__toggle');
  if (toggle) {
    if (toggle.tagName !== 'BUTTON') {
      push('.cdc-nav__toggle', 'nav toggle must be a real <button>');
    }
    if (!toggle.hasAttribute('aria-expanded')) {
      push('.cdc-nav__toggle', 'nav toggle needs aria-expanded');
    }
    const controls = toggle.getAttribute('aria-controls');
    if (!controls || !document.getElementById(controls)) {
      push('.cdc-nav__toggle', 'nav toggle aria-controls must reference the menu id');
    }
  }

  /* ---- footer component (spec §6.5) ---- */
  if (!document.querySelector('footer')) {
    push('footer', 'page must contain a <footer> (contentinfo landmark)');
  }

  return issues;
}

const examplesPath = join(root, 'examples.html');
const indexHtmlPath = join(root, 'index.html');
const guidelinesPath = join(root, 'design-guidelines.html');
const fixturesDir = join(root, 'test', 'fixtures');
const brokenPath = join(fixturesDir, 'broken-a11y.html');

describe('a11y: component usage page renders with no violations (CRE-38 baseline)', () => {
  it('examples.html exists and parses', () => {
    expect(existsSync(examplesPath)).toBe(true);
    const doc = parse(read(examplesPath));
    expect(doc.querySelectorAll('*').length).toBeGreaterThan(0);
  });

  it('reports zero a11y-critical violations', () => {
    const doc = parse(read(examplesPath));
    const issues = lint(doc);
    expect(issues).toEqual([]);
  });

  it('covers every one of the five component types from CRE-38', () => {
    const doc = parse(read(examplesPath));
    for (const selector of [
      '.cdc-button',
      '.cdc-card',
      '.cdc-field',
      '.cdc-nav',
      '.cdc-footer',
    ]) {
      expect(doc.querySelectorAll(selector).length, `missing component ${selector}`).toBeGreaterThan(0);
    }
  });
});

describe('a11y: adopted home page (index.html) renders with no violations (M3-2.4 usage proof)', () => {
  it('index.html exists and parses', () => {
    expect(existsSync(indexHtmlPath)).toBe(true);
    const doc = parse(read(indexHtmlPath));
    expect(doc.querySelectorAll('*').length).toBeGreaterThan(0);
  });

  it('reports zero a11y-critical violations', () => {
    const doc = parse(read(indexHtmlPath));
    const issues = lint(doc);
    expect(issues).toEqual([]);
  });

  it('uses all five component types from CRE-38 in the live page', () => {
    const doc = parse(read(indexHtmlPath));
    for (const selector of [
      '.cdc-button',
      '.cdc-card',
      '.cdc-field',
      '.cdc-nav',
      '.cdc-footer',
    ]) {
      expect(doc.querySelectorAll(selector).length, `missing component ${selector} in index.html`).toBeGreaterThan(0);
    }
  });
});

describe('a11y: design-guidelines page renders with no violations (M3-3 / CRE-35)', () => {
  it('design-guidelines.html exists and parses', () => {
    expect(existsSync(guidelinesPath)).toBe(true);
    const doc = parse(read(guidelinesPath));
    expect(doc.querySelectorAll('*').length).toBeGreaterThan(0);
  });

  it('reports zero a11y-critical violations', () => {
    const doc = parse(read(guidelinesPath));
    const issues = lint(doc);
    expect(issues).toEqual([]);
  });

  it('uses the shared component shell (nav + footer + button)', () => {
    const doc = parse(read(guidelinesPath));
    for (const selector of ['.cdc-button', '.cdc-nav', '.cdc-footer']) {
      expect(doc.querySelectorAll(selector).length, `missing component ${selector} in design-guidelines.html`).toBeGreaterThan(0);
    }
    expect(doc.querySelectorAll('h1').length).toBe(1);
  });
});

describe('a11y: focus-visible and keyboard-visible styles', () => {
  const styleCss = read(join(root, 'src', 'style.css'));
  const cardCss = read(join(root, 'src', 'components', 'card.css'));
  const formCss = read(join(root, 'src', 'components', 'form.css'));

  it('global :focus-visible paints a visible outline', () => {
    expect(styleCss).toMatch(/:focus-visible\s*\{[^}]*outline/s);
  });

  it('interactive cards show focus via :focus-within (no focus lost)', () => {
    expect(cardCss).toMatch(/\.cdc-card--interactive:focus-within\s*\{/);
  });

  it('form controls show a focus state distinct from default', () => {
    expect(formCss).toMatch(/(?:\.cdc-input|\.cdc-textarea|\.cdc-select):focus\s*\{/);
  });

  it('interactive elements are keyboard-reachable native controls', () => {
    const doc = parse(read(examplesPath));
    for (const el of doc.querySelectorAll('.cdc-button, .cdc-nav__toggle, .cdc-card__link, input, select, textarea')) {
      expect(interactiveTags.has(el.tagName), `<${el.tagName}> must be a native interactive element`).toBe(true);
      if (el.tagName === 'A') {
        expect(el.hasAttribute('href'), 'links must have href to be keyboard focusable').toBe(true);
      }
    }
  });
});

describe('a11y regression detection (deliberately broken fixture)', () => {
  it('fixture exists and its violations are caught by the same lint engine', () => {
    expect(existsSync(brokenPath)).toBe(true);
    const doc = parse(read(brokenPath));
    const issues = lint(doc);
    const messages = issues.map((i) => `${i.selector}: ${i.message}`).join('\n');
    expect(issues.length, `expected caught violations but got none`).toBeGreaterThan(0);
    expect(messages).toContain('icon-only button needs an aria-label');
    expect(messages).toContain('no associated <label for>');
    expect(messages).toContain('aria-controls must reference the menu id');
  });
});
