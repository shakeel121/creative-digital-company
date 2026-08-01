import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const headers = readFileSync(join(root, 'public', '_headers'), 'utf8');

const declared = new Map();
for (const line of headers.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('/*')) continue;
  const idx = trimmed.indexOf(':');
  if (idx === -1) continue;
  declared.set(trimmed.slice(0, idx).trim().toLowerCase(), trimmed.slice(idx + 1).trim());
}

describe('security headers baseline (public/_headers)', () => {
  it('applies to all paths', () => {
    expect(headers).toContain('/*');
  });

  it.each([
    ['strict-transport-security', /max-age=\d+/],
    ['content-security-policy', /default-src/],
    ['x-content-type-options', /nosniff/],
    ['x-frame-options', /SAMEORIGIN|DENY/],
    ['referrer-policy', /strict-origin-when-cross-origin/],
    ['permissions-policy', /geolocation=\(\)/],
  ])('declares baseline header "%s" with a sensible value', (header, pattern) => {
    const value = declared.get(header);
    expect(value, `missing header ${header}`).toBeDefined();
    expect(value).toMatch(pattern);
  });

  it('does not allow unsafe inline script execution', () => {
    const csp = declared.get('content-security-policy');
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  });
});
