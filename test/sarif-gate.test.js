import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const gate = join(root, 'scripts', 'sarif-gate.js');
const repoAcceptances = join(root, 'security', 'sast-acceptances.json');

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

const makeReport = (ruleId, severity) => ({
  version: '2.1.0',
  runs: [
    {
      tool: {
        driver: {
          name: 'semgrep',
          rules: [{ id: ruleId, properties: { 'security-severity': String(severity) } }],
        },
      },
      results: [
        {
          ruleId,
          level: 'error',
          message: { text: `finding for ${ruleId}` },
          locations: [{ physicalLocation: { artifactLocation: { uri: 'src/x.js' } } }],
        },
      ],
    },
  ],
});

const gateExit = ({ reportPath, threshold, env, acceptancesPath }) => {
  const args = [gate, reportPath];
  if (threshold !== undefined) args.push(String(threshold));
  const res = spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...(env ?? {}), SAST_ACCEPTANCES_PATH: acceptancesPath },
    encoding: 'utf8',
  });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
};

describe('sarif-gate (SAST risk-acceptance gate)', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'sarif-gate-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const write = (name, content) => {
    const p = join(dir, name);
    writeFileSync(p, content, 'utf8');
    return p;
  };

  it('blocks a high-severity finding (severity >= 7.0)', () => {
    const report = write('high.sarif', JSON.stringify(makeReport('js.security.audit.xss', 8.5)));
    const r = gateExit({ reportPath: report, acceptancesPath: repoAcceptances });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('FAIL');
    expect(r.stdout).toContain('js.security.audit.xss');
  });

  it('passes a low-severity finding', () => {
    const report = write('low.sarif', JSON.stringify(makeReport('js.lang.security.taint', 4.0)));
    const r = gateExit({ reportPath: report, acceptancesPath: repoAcceptances });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS');
  });

  it('fails closed when the SARIF report is missing', () => {
    const r = gateExit({ reportPath: join(dir, 'nope.sarif'), acceptancesPath: repoAcceptances });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('cannot read SARIF report');
  });

  it('fails when SAST_THRESHOLD is below the 7.0 floor (variable cannot loosen the gate)', () => {
    const report = write('low.sarif', JSON.stringify(makeReport('js.audit.log', 5.5)));
    const r = gateExit({
      reportPath: report,
      acceptancesPath: repoAcceptances,
      env: { SAST_THRESHOLD: '6.0' },
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('below the 7.0 baseline floor');
  });

  it('fails closed on a non-numeric threshold', () => {
    const report = write('high.sarif', JSON.stringify(makeReport('js.security.audit.xss', 8.5)));
    const r = gateExit({
      reportPath: report,
      acceptancesPath: repoAcceptances,
      env: { SAST_THRESHOLD: 'loose' },
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('not numeric');
  });

  it('does not loosen the gate when SAST_THRESHOLD is raised above baseline (clamped to 7.0)', () => {
    const report = write('high.sarif', JSON.stringify(makeReport('js.security.audit.xss', 8.5)));
    const r = gateExit({
      reportPath: report,
      acceptancesPath: repoAcceptances,
      env: { SAST_THRESHOLD: '9.0' },
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('clamped to 7.0');
  });

  it('passes when a rule carries a valid tracked acceptance (file is the source of truth)', () => {
    const acceptances = write(
      'acceptances-valid.json',
      JSON.stringify([
        {
          ruleId: 'js.security.audit.xss',
          tracking: 'CRE-000',
          owner: 'SecLead',
          reason: 'dev-only fixture, no prod exposure',
          reEval: futureDate(),
        },
      ]),
    );
    const report = write('high.sarif', JSON.stringify(makeReport('js.security.audit.xss', 8.5)));
    const r = gateExit({ reportPath: report, acceptancesPath: acceptances });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS');
  });

  it('fails when a tracked acceptance is expired', () => {
    const acceptances = write(
      'acceptances-expired.json',
      JSON.stringify([
        {
          ruleId: 'js.security.audit.xss',
          tracking: 'CRE-000',
          owner: 'SecLead',
          reason: 'acceptance lapsed',
          reEval: '2020-01-01',
        },
      ]),
    );
    const report = write('low.sarif', JSON.stringify(makeReport('js.security.audit.xss', 5.5)));
    const r = gateExit({ reportPath: report, acceptancesPath: acceptances });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('expired');
  });

  it('fails closed on a malformed acceptances file', () => {
    const acceptances = write('acceptances-bad.json', '{ not json');
    const report = write('high.sarif', JSON.stringify(makeReport('js.security.audit.xss', 8.5)));
    const r = gateExit({ reportPath: report, acceptancesPath: acceptances });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('cannot read acceptances file');
  });
});
