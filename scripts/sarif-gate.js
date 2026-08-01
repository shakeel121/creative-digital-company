#!/usr/bin/env node
/**
 * Fail CI when a SARIF report contains critical/high findings.
 *
 * Usage:
 *   node scripts/sarif-gate.js <report.sarif> [threshold]
 *
 * A finding blocks the build when either:
 *   - its rule's `properties.security-severity` is >= threshold (default 7.0), or
 *   - its SARIF level is "error" and no numeric severity is available.
 *
 * Rules can be excluded with SAST_IGNORE_RULES (comma-separated rule ids). Every
 * exclusion must carry a justification in .github/workflows (see docs runbook).
 */
import { readFileSync } from 'node:fs';

const reportPath = process.argv[2];
const threshold = Number(process.argv[3] ?? process.env.SAST_THRESHOLD ?? 7.0);
const ignoredRules = new Set(
  (process.env.SAST_IGNORE_RULES ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);

if (!reportPath) {
  console.error('usage: node scripts/sarif-gate.js <report.sarif> [threshold]');
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error(`[sarif-gate] cannot read SARIF report "${reportPath}": ${err.message}`);
  process.exit(1);
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
    if (ignoredRules.has(ruleId)) continue;
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
  `[sarif-gate] ${total} finding(s), ${blocked.length} blocking (threshold >= ${threshold})`,
);
for (const b of blocked) {
  console.log(`  BLOCK ${b.severity} ${b.ruleId} ${b.path} :: ${b.message}`);
}

if (blocked.length > 0) {
  console.error(
    `[sarif-gate] FAIL: ${blocked.length} critical/high finding(s) across ${uniqueBlockedRules} rule(s). ` +
      'Fix the findings or justify + exclude specific rules via SAST_IGNORE_RULES.',
  );
  process.exit(1);
}

console.log('[sarif-gate] PASS: no critical/high findings.');
