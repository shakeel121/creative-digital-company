import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tokensPath = join(root, 'src', 'tokens', 'tokens.css');
const stylePath = join(root, 'src', 'style.css');
const mainPath = join(root, 'src', 'main.js');
const htmlPath = join(root, 'index.html');

const tokens = readFileSync(tokensPath, 'utf8');
const style = readFileSync(stylePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const html = readFileSync(htmlPath, 'utf8');

describe('design tokens module (src/tokens/tokens.css)', () => {
  it('exists and imports the brand identity values (CRE-52)', () => {
    expect(existsSync(tokensPath)).toBe(true);
    expect(tokens).toMatch(/@import\s+['"]\.\.\/brand\/brand\.css['"]/);
  });

  it('defines :root site tokens for the M1 site', () => {
    expect(tokens).toMatch(/:root/);
    expect(tokens).toMatch(/--nav-height:\s*4rem/);
  });
});

describe('site consumes module tokens (src/style.css)', () => {
  it('no longer defines an ad-hoc :root token block', () => {
    expect(style).not.toMatch(/:root\s*\{/);
  });

  it('has no hardcoded color literals', () => {
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(style).not.toMatch(/rgba?\(/);
  });

  it.each([
    '--color-bg',
    '--color-surface',
    '--color-accent',
    '--color-on-accent',
    '--color-border',
    '--color-focus',
    '--space-',
    '--radius-',
    '--text-',
    '--font-sans',
    '--shadow-',
    '--container-max',
    '--nav-height',
  ])('references module token category %s', (token) => {
    expect(style).toContain(`var(${token}`);
  });
});

describe('entry imports the tokens module', () => {
  it('main.js imports the tokens module before the site stylesheet', () => {
    expect(main).toMatch(/import\s+['"]\.\/tokens\/tokens\.css['"]/);
    const tokensIndex = main.indexOf('./tokens/tokens.css');
    const styleIndex = main.indexOf('./style.css');
    expect(tokensIndex).toBeGreaterThan(-1);
    expect(styleIndex).toBeGreaterThan(tokensIndex);
  });

  it('html sets data-theme="dark" so the site consumes dark semantic tokens', () => {
    expect(html).toMatch(/<html lang="en"[^>]*data-theme="dark"/);
  });
});
