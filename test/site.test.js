import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const indexPath = join(root, 'index.html');
const html = readFileSync(indexPath, 'utf8');

const getIds = (source) => [...source.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const getInPageLinks = (source) => [...source.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);

describe('index.html', () => {
  it('is a valid HTML document with lang and viewport', () => {
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toContain('name="viewport"');
  });

  it('declares the company name in title and description', () => {
    expect(html).toMatch(/<title>.*Creative Digital Company/i);
    expect(html).toMatch(/name="description"/);
  });

  it('has all required sections', () => {
    for (const id of ['top', 'services', 'work', 'contact']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('has no broken in-page anchor links', () => {
    const ids = getIds(html);
    const links = getInPageLinks(html);
    expect(links.length).toBeGreaterThan(0);
    for (const target of links) {
      expect(ids).toContain(target);
    }
  });

  it('wires up the entry script which imports the stylesheet', () => {
    expect(html).toContain('src/main.js');
    const mainSource = readFileSync(join(root, 'src', 'main.js'), 'utf8');
    expect(mainSource).toMatch(/import\s+'\.\/style\.css'/);
  });
});

describe('assets', () => {
  it('references only files that exist', () => {
    const stylePath = join(root, 'src', 'style.css');
    const mainPath = join(root, 'src', 'main.js');
    const faviconPath = join(root, 'public', 'favicon.svg');
    expect(existsSync(stylePath)).toBe(true);
    expect(existsSync(mainPath)).toBe(true);
    expect(existsSync(faviconPath)).toBe(true);
  });
});

describe('main.js', () => {
  it('keeps the console clean', () => {
    const source = readFileSync(join(root, 'src', 'main.js'), 'utf8');
    expect(source).not.toMatch(/console\./);
  });
});
