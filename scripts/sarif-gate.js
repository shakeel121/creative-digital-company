#!/usr/bin/env node
/**
 * Fail CI when a SARIF report contains critical/high findings.
 *
 * Usage:
 *   node scripts/sarif-gate.js <report.sarif> [threshold]
 *
 * A finding blocks the build when either:
 *   - its rule's `properties.security-severity` is >= threshold (baseline 7.0), or
 *   - its SARIF level is "error" and no numeric severity is available.
 *
 * The threshold can never loosen the gate (docs/VULNERABILITY_MANAGEMENT.md §4):
 *   - a non-numeric value fails closed,
 *   - a value below the 7.0 baseline floor fails the build,
 *   - a value above the baseline is clamped back to 7.0 with a warning.
 *
 * Rules are excluded only through a commit-tracked acceptances file
 * (security/sast-acceptances.json). Every entry must carry a `tracking:
 * <PREFIX>-NNN` reference, an owner, a reason, and a future `reEval` date;
 * missing or expired entries fail the build. SAST_IGNORE_RULES is intentionally
 * removed so a repo-settings change cannot silently silence a rule without a
 * reviewed commit.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASELINE = 7.0;
const DEFAULT_ACCEPTANCES = join(process.cwd(), 'security', 'sast-acceptances.json');
const TRACKING_RE = /^[A-Z]+-\d+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const reportPath = process.argv[2];

const fail = (msg) => {
  console.error(`[sarif-gate] FAIL: ${msg}`);
  process.exit(1);
};

if (!reportPath) {
  console.error('usage: node scripts/sarif-gate.js <report.sarif> [threshold]');
  process.exit(2);
}

// --- 1. Threshold floor (fail-closed, no silent loosening) ---
const rawThreshold = process.argv[3] ?? process.env.SAST_THRESHOLD ?? String(BASELINE);
const requested = Number(rawThreshold);
if (Number.isNaN(requested)) {
  fail(`SAST_THRESHOLD is not numeric ("${rawThreshold}") — refusing to run a gate whose bar cannot be read.`);
}
if (requested < BASELINE) {
  fail(`SAST_THRESHOLD ${requested} is below the 7.0 baseline floor — a variable cannot loosen the gate.`);
}
const threshold = Math.min(requested, BASELINE);
if (threshold !== requested) {
  console.warn(
    `[sarif-gate] WARNING: SAST_THRESHOLD ${requested} is above the 7.0 baseline and was clamped to 7.0 — ` +
      'the gate cannot be loosened.',
  );
}

// --- 2. Tracked acceptances (source of truth for rule exclusions) ---
const acceptancesPath = process.env.SAST_ACCEPTANCES_PATH ?? DEFAULT_ACCEPTANCES;
let acceptances;
if (!existsSync(acceptancesPath)) {
  fail(`acceptances file not found at "${acceptancesPath}" — expected a commit-tracked security/sast-acceptances.json.`);
}
try {
  acceptances = JSON.parse(readFileSync(acceptancesPath, 'utf8'));
} catch (err) {
  fail(`cannot read acceptances file "${acceptancesPath}": ${err.message}`);
}
if (!Array.isArray(acceptances)) {
  fail(`acceptances file "${acceptancesPath}" must be a JSON array of {ruleId, tracking, owner, reason, reEval}.`);
}

const today = new Date().toISOString().slice(0, 10);
const acceptedRules = new Set();
for (const entry of acceptances) {
  const { ruleId, tracking, owner, reason, reEval } = entry ?? {};
  if (typeof ruleId !== 'string' || ruleId.length === 0) {
    fail(`acceptance entry is missing a "ruleId": ${JSON.stringify(entry)}`);
  }
  if (typeof tracking !== 'string' || !TRACKING_RE.test(tracking)) {
    fail(`acceptance for "${ruleId}" is missing a "tracking: <PREFIX>-NNN" reference`);
  }
  if (typeof owner !== 'string' || owner.length === 0) {
    fail(`acceptance for "${ruleId}" is missing an "owner"`);
  }
  if (typeof reason !== 'string' || reason.length === 0) {
    fail(`acceptance for "${ruleId}" is missing a "reason"`);
  }
  if (typeof reEval !== 'string' || !DATE_RE.test(reEval)) {
    fail(`acceptance for "${ruleId}" is missing a "reEval" date (YYYY-MM-DD)`);
  }
  if (reEval < today) {
    fail(`acceptance for "${ruleId}" expired on ${reEval} — re-evaluation is due. Update or remove the entry.`);
  }
  acceptedRules.add(ruleId);
}

// --- 3. Read the SARIF report ---
let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (err) {
  fail(`cannot read SARIF report "${reportPath}": ${err.message}`);
}

const rules = new Map();
for (const run of report.runs ?? []) {
  for (const rule of run.tool?.driver?.rules ?? []) {
    const numeric = Number(rule.properties?.['security-severity'] ?? NaN);
    rules.set(rule.id, { numeric });
  }
}

const blocked = [];
let total = 0;
for (const run of report.runs ?? []) {
  for (const result of run.results ?? []) {
    total += 1;
    const ruleId = result.ruleId;
    if (acceptedRules.has(ruleId)) continue;
    const { numeric } = rules.get(ruleId) ?? {};
    const level = result.level ?? result.properties?.['level'] ?? 'warning';
    const sev = !Number.isNaN(numeric) ? numeric : NaN;
    const isBlocking =
      (!Number.isNaN(sev) && sev >= threshold) || (Number.isNaN(sev) && level === 'error');
    if (isBlocking) {
      blocked.push({
        ruleId,
        severity: Number.isNaN(sev) ? level : sev,
        message: (result.message?.text ?? '').split('\n')[0],
        path: result.locations?.[0]?.physicalLocation?.artifactLocation?.uri ?? '',
      });
    }
  }
}

const uniqueBlockedRules = new Set(blocked.map((b) => b.ruleId)).size;
console.log(
  `[sarif-gate] ${total} finding(s), ${blocked.length} blocking (threshold >= ${threshold}), ` +
    `${acceptedRules.size} rule(s) accepted via tracked acceptances`,
);
for (const b of blocked) {
  console.log(`  BLOCK ${b.severity} ${b.ruleId} ${b.path} :: ${b.message}`);
}

if (blocked.length > 0) {
  console.error(
    `[sarif-gate] FAIL: ${blocked.length} critical/high finding(s) across ${uniqueBlockedRules} rule(s). ` +
      'Fix the findings or accept them via security/sast-acceptances.json with SecLead sign-off ' +
      '(docs/VULNERABILITY_MANAGEMENT.md §4).',
  );
  process.exit(1);
}

console.log('[sarif-gate] PASS: no critical/high findings.');
