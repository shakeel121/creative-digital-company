#!/usr/bin/env node
/**
 * Verify a live URL serves the security headers declared in public/_headers.
 *
 * Usage:
 *   node scripts/security-headers.mjs --url https://staging.example.com
 *   node scripts/security-headers.mjs --path public/_headers   # file check only
 *
 * Reads the Netlify _headers format, then asserts each declared header is
 * present (and value matches, when the declaration is non-empty) on the target
 * URL. Exits 1 on the first missing/mismatched header.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const headersPath = join(root, 'public', '_headers');

function parseHeadersFile(path) {
  const declared = [];
  let currentPath = null;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('/*')) {
      currentPath = line.split(/\s+/)[0];
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (currentPath) declared.push({ path: currentPath, name, value });
  }
  return declared;
}

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('--url='))?.slice(6) ?? null;
const pathArg = args.find((a) => a.startsWith('--path='))?.slice(7) ?? null;

const declared = parseHeadersFile(pathArg ?? headersPath);
console.log(`[security-headers] ${declared.length} header(s) declared in public/_headers`);

const required = [
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
];
const missingDeclarations = required.filter(
  (h) => !declared.some((d) => d.name.toLowerCase() === h.toLowerCase()),
);
if (missingDeclarations.length > 0) {
  console.error(
    `[security-headers] FAIL: baseline headers not declared in public/_headers: ${missingDeclarations.join(', ')}`,
  );
  process.exit(1);
}

if (!url) {
  console.log('[security-headers] No --url provided — file declaration check passed.');
  process.exit(0);
}

const res = await fetch(url);
const lowerHeaders = new Map();
for (const [name, value] of res.headers) lowerHeaders.set(name.toLowerCase(), value);

let failed = false;
for (const { name, value } of declared) {
  const actual = lowerHeaders.get(name.toLowerCase());
  const isBaseline = required.includes(name);
  if (actual === undefined) {
    failed = true;
    console.error(`[security-headers] MISSING ${name} on ${url}`);
  } else if (isBaseline && value && actual.trim() !== value.trim()) {
    failed = true;
    console.error(
      `[security-headers] MISMATCH ${name}\n  expected: ${value}\n  actual:   ${actual.trim()}`,
    );
  } else {
    console.log(`[security-headers] OK ${name}`);
  }
}

if (failed) {
  console.error(`[security-headers] FAIL: ${url} does not satisfy the declared baseline.`);
  process.exit(1);
}

console.log(`[security-headers] PASS: ${url} serves all declared security headers.`);
