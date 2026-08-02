#!/usr/bin/env node
/**
 * Enforce the SecLead risk-acceptance gate.
 *
 * Risk acceptance is a controlled action: a finding may only be accepted when the
 * acceptance is tracked (a `tracking:` reference to a Paperclip issue) and the
 * scanner config is actually wired into CI. This script fails the build when that
 * contract is broken, so an undocumented acceptance cannot merge.
 *
 * Checks:
 *  1. .trivyignore                  every CVE/GHSA entry carries a `# tracking: <PREFIX>-NNN`
 *                                   reference, either inline or on the following comment line.
 *  2. security/sast-acceptances.json  every SAST acceptance has a `tracking` reference, an
 *                                   `owner`, a `reason`, and a future `reEval` date. Duplicate
 *                                   rule ids and expired entries are rejected. A bare repo
 *                                   variable (SAST_IGNORE_RULES) can no longer accept a rule —
 *                                   the accept path is commit-tracked only.
 *  3. ci.yml                        the SAST gate and this validator run in the security job.
 *
 * Usage:
 *   node scripts/validate-risk-acceptance.js \
 *     [--trivy-ignore .trivyignore] [--workflow .github/workflows/ci.yml] \
 *     [--acceptances security/sast-acceptances.json]
 */
import { readFileSync, existsSync } from 'node:fs';

const DEFAULT_TRIVY_IGNORE = '.trivyignore';
const DEFAULT_WORKFLOW = '.github/workflows/ci.yml';
const DEFAULT_ACCEPTANCES = 'security/sast-acceptances.json';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const trivyIgnorePath = opt('trivy-ignore', DEFAULT_TRIVY_IGNORE);
const workflowPath = opt('workflow', DEFAULT_WORKFLOW);
const acceptancesPath = opt('acceptances', DEFAULT_ACCEPTANCES);

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

// --- 2. SAST acceptances (commit-tracked file is the source of truth) ---
if (existsSync(acceptancesPath)) {
  let acceptances;
  try {
    acceptances = JSON.parse(readFileSync(acceptancesPath, 'utf8'));
  } catch (err) {
    fail(`cannot parse ${acceptancesPath}: ${err.message}`);
    acceptances = undefined;
  }
  if (acceptances !== undefined) {
    if (!Array.isArray(acceptances)) {
      fail(`${acceptancesPath} must be a JSON array of {ruleId, tracking, owner, reason, reEval}.`);
    } else if (acceptances.length === 0) {
      ok(`${acceptancesPath} is empty (no SAST acceptances yet)`);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const seen = new Set();
      let allOk = true;
      for (const [idx, entry] of acceptances.entries()) {
        const pos = `${acceptancesPath} entry #${idx + 1}`;
        const { ruleId, tracking, owner, reason, reEval } = entry ?? {};
        if (typeof ruleId !== 'string' || ruleId.length === 0) {
          fail(`${pos} is missing a "ruleId"`);
          continue;
        }
        if (seen.has(ruleId)) {
          fail(`${pos}: duplicate rule "${ruleId}" in the acceptances file`);
          allOk = false;
        }
        seen.add(ruleId);
        if (typeof tracking !== 'string' || !/^[A-Z]+-\d+$/.test(tracking)) {
          fail(`${pos} ("${ruleId}") is missing a "tracking: <PREFIX>-NNN" reference`);
          allOk = false;
        }
        if (typeof owner !== 'string' || owner.length === 0) {
          fail(`${pos} ("${ruleId}") is missing an "owner"`);
          allOk = false;
        }
        if (typeof reason !== 'string' || reason.length === 0) {
          fail(`${pos} ("${ruleId}") is missing a "reason"`);
          allOk = false;
        }
        if (typeof reEval !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(reEval)) {
          fail(`${pos} ("${ruleId}") has an invalid "reEval" date (expected YYYY-MM-DD)`);
          allOk = false;
        } else if (reEval < today) {
          fail(`${pos} ("${ruleId}") expired on ${reEval} — re-evaluation is due`);
          allOk = false;
        }
      }
      if (allOk) ok(`${acceptancesPath} is fully tracked and current`);
    }
  }
} else {
  fail(`missing ${acceptancesPath} — SAST acceptances must be commit-tracked`);
}

// --- 3. CI wiring ---
if (existsSync(workflowPath)) {
  const workflow = readFileSync(workflowPath, 'utf8');
  if (workflow.includes('sarif-gate')) {
    ok('ci.yml runs the SAST gate (scripts/sarif-gate.js)');
  } else {
    fail('ci.yml does not run scripts/sarif-gate.js — add it to the security job.');
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
