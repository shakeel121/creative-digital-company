import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const componentsDir = join(root, 'src', 'components');

const cssFiles = ['button', 'card', 'form', 'nav', 'footer'];

const read = (path) => readFileSync(path, 'utf8');

describe('component library (src/components)', () => {
  it('ships all five component stylesheets plus an aggregator', () => {
    for (const name of [...cssFiles, 'index']) {
      expect(existsSync(join(componentsDir, `${name}.css`)), `${name}.css should exist`).toBe(true);
    }
  });

  it('ships behavior modules for the interactive components', () => {
    expect(existsSync(join(componentsDir, 'nav.js'))).toBe(true);
    expect(existsSync(join(componentsDir, 'form.js'))).toBe(true);
  });

  it('aggregator imports every component stylesheet', () => {
    const indexCss = read(join(componentsDir, 'index.css'));
    for (const name of cssFiles) {
      expect(indexCss).toContain(`@import './${name}.css'`);
    }
  });

  it.each(cssFiles)('%s.css contains no hardcoded color literals', (name) => {
    const css = read(join(componentsDir, `${name}.css`));
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(|hsla?\(/);
  });

  it.each(cssFiles)('%s.css consumes design tokens only', (name) => {
    const css = read(join(componentsDir, `${name}.css`));
    expect(css).toMatch(/var\(--color-/);
    expect(css).toMatch(/var\(--space-/);
  });

  it('behavior modules stay quiet and null-guarded', () => {
    const navJs = read(join(componentsDir, 'nav.js'));
    const formJs = read(join(componentsDir, 'form.js'));
    for (const source of [navJs, formJs]) {
      expect(source).not.toMatch(/console\./);
    }
    expect(navJs).toMatch(/aria-expanded/);
    expect(navJs).toMatch(/\?\./);
    expect(formJs).toMatch(/aria-invalid/);
    expect(formJs).toMatch(/\?\./);
  });
});

describe('component usage examples', () => {
  const examplesHtml = read(join(root, 'examples.html'));
  const examplesJs = read(join(componentsDir, 'examples.js'));

  it('examples.html exercises every component', () => {
    for (const cls of ['cdc-button', 'cdc-card', 'cdc-field', 'cdc-nav', 'cdc-footer']) {
      expect(examplesHtml).toContain(cls);
    }
    expect(examplesHtml).toContain('cdc-button--primary');
    expect(examplesHtml).toContain('cdc-button--secondary');
    expect(examplesHtml).toContain('cdc-button--ghost');
    expect(examplesHtml).toContain('cdc-card--interactive');
    expect(examplesHtml).toContain('cdc-card--featured');
  });

  it('examples entry loads the same chain as the app entry', () => {
    expect(examplesJs).toMatch(/tokens\.css/);
    expect(examplesJs).toMatch(/style\.css/);
    expect(examplesJs).toMatch(/index\.css/);
    expect(examplesJs).toMatch(/nav\.js/);
    expect(examplesJs).toMatch(/form\.js/);
  });

  it('main.js consumes the component library', () => {
    const main = read(join(root, 'src', 'main.js'));
    expect(main).toMatch(/components\/index\.css/);
  });
});
