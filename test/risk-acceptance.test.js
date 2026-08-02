import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const validator = join(root, 'scripts', 'validate-risk-acceptance.js');

const runValidator = (args) =>
  execFileSync(process.execPath, [validator, ...args], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

const expectValidatorFailure = (args, needles) => {
  let threw = false;
  try {
    runValidator(args);
  } catch (err) {
    threw = true;
    expect(String(err.stderr)).toContain('FAIL');
    for (const n of needles) expect(String(err.stderr)).toContain(n);
  }
  expect(threw).toBe(true);
};

describe('risk-acceptance gate (SecLead sign-off)', () => {
  it('passes on the repo config (fully tracked .trivyignore + wired SAST knobs)', () => {
    const out = runValidator([]);
    expect(out).toContain('PASS');
  });

  it('fails on an untracked .trivyignore entry', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ra-gate-'));
    try {
      const bad = join(dir, '.trivyignore');
      writeFileSync(bad, 'CVE-2099-99999\n', 'utf8');
      let threw = false;
      try {
        runValidator([
          '--trivy-ignore',
          bad,
          '--workflow',
          join(root, '.github', 'workflows', 'ci.yml'),
        ]);
      } catch (err) {
        threw = true;
        expect(String(err.stderr)).toContain('CVE-2099-99999');
        expect(String(err.stderr)).toContain('FAIL');
      }
      expect(threw).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts an entry with an inline tracking reference', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ra-gate-'));
    try {
      const good = join(dir, '.trivyignore');
      writeFileSync(
        good,
        'CVE-2099-99999  # tracking: CRE-000 # dev-only dep, no prod exposure, re-eval 2026-11-01\n',
        'utf8',
      );
      const out = runValidator([
        '--trivy-ignore',
        good,
        '--workflow',
        join(root, '.github', 'workflows', 'ci.yml'),
      ]);
      expect(out).toContain('tracked via CRE-000');
      expect(out).toContain('PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails on an untracked SAST acceptance (no tracking ref in the acceptances file)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ra-gate-'));
    try {
      const acc = join(dir, 'sast-acceptances.json');
      writeFileSync(
        acc,
        JSON.stringify([
          {
            ruleId: 'js.security.audit.xss',
            owner: 'SecLead',
            reason: 'dev-only fixture',
            reEval: futureDate(),
          },
        ]),
        'utf8',
      );
      expectValidatorFailure(['--acceptances', acc], ['js.security.audit.xss', 'tracking']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails on an expired SAST acceptance (past reEval)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ra-gate-'));
    try {
      const acc = join(dir, 'sast-acceptances.json');
      writeFileSync(
        acc,
        JSON.stringify([
          {
            ruleId: 'js.security.audit.xss',
            tracking: 'CRE-000',
            owner: 'SecLead',
            reason: 'acceptance lapsed',
            reEval: '2020-01-01',
          },
        ]),
        'utf8',
      );
      expectValidatorFailure(['--acceptances', acc], ['js.security.audit.xss', 'expired']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('passes a fully-tracked SAST acceptances file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ra-gate-'));
    try {
      const acc = join(dir, 'sast-acceptances.json');
      writeFileSync(
        acc,
        JSON.stringify([
          {
            ruleId: 'js.security.audit.xss',
            tracking: 'CRE-000',
            owner: 'SecLead',
            reason: 'dev-only fixture, no prod exposure',
            reEval: futureDate(),
          },
        ]),
        'utf8',
      );
      const out = runValidator(['--acceptances', acc]);
      expect(out).toContain('fully tracked and current');
      expect(out).toContain('PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
