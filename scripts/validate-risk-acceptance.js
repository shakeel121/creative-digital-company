#!/usr/bin/env node
/**
 * Enforce the SecLead risk-acceptance gate.
 *
 * Risk acceptance is a controlled action: a finding may only be accepted when the
 * acceptance is tracked (a `tracking:` reference to a Paperclip issue) and the scanner
 * config is actually wired into CI. This script fails the build when that contract is
 * broken, so an undocumented acceptance cannot merge.
 *
 * Checks:
 *  1. .trivyignore       every CVE/GHSA entry carries a `# tracking: <PREFIX>-NNN`
 *                        reference, either inline or on the following comment line.
 *  2. ci.yml             the SAST gate step wires `SAST_IGNORE_RULES` and `SAST_THRESHOLD`
 *                        from GitHub variables (otherwise the documented SAST accept path
 *                        is dead config), and this validator itself runs in CI.
 *
 * Usage:
 *   node scripts/validate-risk-acceptance.js [--trivy-ignore .trivyignore] [--workflow .github/workflows/ci.yml]
 */
import { readFileSync, existsSync } from 'node:fs';

const DEFAULT_TRIVY_IGNORE = '.trivyignore';
const DEFAULT_WORKFLOW = '.github/workflows/ci.yml';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const trivyIgnorePath = opt('trivy-ignore', DEFAULT_TRIVY_IGNORE);
const workflowPath = opt('workflow', DEFAULT_WORKFLOW);

const errors = [];
const ok = (msg) => console.log(`  ok  ${msg}`);
const fail = (msg) => errors.push(msg);

// --- 1. .trivyignore tracking references ---
if (existsSync(trivyIgnorePath)) {
  const lines = readFileSync(trivyIgnorePath, 'utf8').split(/\r?\n/);
  const entryRe = /^\s*(CVE-\d{4}-\d+|GHSA-[a-z0-9]+(?:-[a-z0-9]+)+|TEMP-\d+)\b/i;
  const trackingRe = /#\s*tracking:\s*([A-Z]+-\d+)\b/i;
  let openEntry = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) {
      openEntry = false;
      continue;
    }
    const m = line.match(entryRe);
    if (!m) continue;
    const inline = line.match(trackingRe);
    if (inline) {
      ok(`.trivyignore:${i + 1} ${m[1]} tracked via ${inline[1]}`);
      openEntry = false;
      continue;
    }
    const next = (lines[i + 1] ?? '').trim();
    const nextTrack = next.startsWith('#') ? next.match(trackingRe) : null;
    if (nextTrack) {
      ok(`.trivyignore:${i + 1} ${m[1]} tracked via ${nextTrack[1]}`);
      openEntry = false;
      continue;
    }
    openEntry = true;
    fail(
      `.trivyignore:${i + 1} entry "${m[1]}" has no tracking reference. Add an inline ` +
        '`# tracking: <PREFIX>-NNN` comment (or on the next line) with owner, reason, and re-evaluation date.',
    );
  }
  if (!openEntry && errors.length === 0) ok('.trivyignore is empty or fully tracked');
} else {
  fail(`missing ${trivyIgnorePath}`);
}

// --- 2. CI wiring of the risk-acceptance knobs ---
if (existsSync(workflowPath)) {
  const workflow = readFileSync(workflowPath, 'utf8');
  if (/SAST_IGNORE_RULES/.test(workflow)) {
    ok('ci.yml wires SAST_IGNORE_RULES into the SAST gate');
  } else {
    fail(
      'ci.yml does not set SAST_IGNORE_RULES — the documented SAST accept path cannot work. Add `SAST_IGNORE_RULES: ${{ vars.SAST_IGNORE_RULES }}` to the gate step env.',
    );
  }
  if (/SAST_THRESHOLD/.test(workflow)) {
    ok('ci.yml wires SAST_THRESHOLD into the SAST gate');
  } else {
    fail(
      'ci.yml does not set SAST_THRESHOLD — add `SAST_THRESHOLD: ${{ vars.SAST_THRESHOLD }}` to the gate step env.',
    );
  }
  if (workflow.includes('validate-risk-acceptance')) {
    ok('ci.yml runs the risk-acceptance validator');
  } else {
    fail('ci.yml does not run scripts/validate-risk-acceptance.js — add it to the security job.');
  }
} else {
  fail(`missing ${workflowPath}`);
}

if (errors.length > 0) {
  console.error(`[validate-risk-acceptance] FAIL (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    'Risk acceptances require SecLead sign-off and a tracking ticket. ' +
      'See docs/VULNERABILITY_MANAGEMENT.md §4.',
  );
  process.exit(1);
}
console.log('[validate-risk-acceptance] PASS: all risk acceptances are tracked and wired.');
