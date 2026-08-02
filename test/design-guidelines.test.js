import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pagePath = join(root, 'design-guidelines.html');
const cssPath = join(root, 'src', 'design-guidelines.css');
const entryPath = join(root, 'src', 'design-guidelines.js');
const indexPath = join(root, 'index.html');

const html = readFileSync(pagePath, 'utf8');
const css = readFileSync(cssPath, 'utf8');
const entry = readFileSync(entryPath, 'utf8');
const index = readFileSync(indexPath, 'utf8');

const getIds = (source) => [...source.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const getInPageLinks = (source) => [...source.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);

describe('design-guidelines.html (M3-3 / CRE-35)', () => {
  it('exists as a valid HTML document with lang, viewport, and dark theme', () => {
    expect(existsSync(pagePath)).toBe(true);
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toMatch(/<html lang="en"[^>]*data-theme="dark"/);
    expect(html).toContain('name="viewport"');
  });

  it('declares the company name and a page-specific description and title', () => {
    expect(html).toMatch(/<title>.*Creative Digital Company/i);
    expect(html).toContain('name="description"');
    expect(html).toContain('Design guidelines');
  });

  it('has exactly one h1 and all required sections', () => {
    expect(html.match(/<h1[\s>]/g)?.length ?? 0).toBe(1);
    for (const id of ['top', 'brand', 'color', 'type', 'space', 'motion', 'components', 'accessibility']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('has no broken in-page anchor links', () => {
    const ids = getIds(html);
    const links = getInPageLinks(html);
    expect(links.length).toBeGreaterThan(0);
    for (const target of links) {
      expect(ids, `missing anchor target "#${target}"`).toContain(target);
    }
  });

  it('links back to the site and to the component examples page', () => {
    expect(html).toContain('href="./index.html"');
    expect(html).toContain('href="./examples.html"');
  });

  it('wires its own entry module that loads the full asset chain', () => {
    expect(html).toContain('src/design-guidelines.js');
    expect(entry).toMatch(/import\s+['"]\.\/tokens\/tokens\.css['"]/);
    expect(entry).toMatch(/import\s+['"]\.\/style\.css['"]/);
    expect(entry).toMatch(/components\/index\.css/);
    expect(entry).toMatch(/design-guidelines\.css/);
    const tokensIndex = entry.indexOf('./tokens/tokens.css');
    const styleIndex = entry.indexOf('./style.css');
    expect(tokensIndex).toBeGreaterThan(-1);
    expect(styleIndex).toBeGreaterThan(tokensIndex);
  });
});

describe('design-guidelines stylesheet consumes tokens only', () => {
  it('has no hardcoded color literals', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(|hsla?\(/);
  });

  it('references design-token categories via var()', () => {
    expect(css).toMatch(/var\(--color-/);
    expect(css).toMatch(/var\(--space-/);
    expect(css).toMatch(/var\(--text-/);
    expect(css).toMatch(/var\(--radius-/);
  });

  it('swatch chips map to brand raw palette tokens', () => {
    for (const token of ['ink-950', 'accent-500', 'success-700', 'danger-500']) {
      expect(css).toContain(`data-token='${token}'`);
      expect(css).toContain(`background-color: var(--${token})`);
    }
  });
});

describe('the site links to the design-guidelines page', () => {
  it('index.html exposes the Design page in the primary nav and footer', () => {
    expect(index).toMatch(/cdc-nav__link" href="\.\/design-guidelines\.html"/);
    expect(index).toMatch(/cdc-footer__nav[\s\S]*href="\.\/design-guidelines\.html"/);
  });
});
