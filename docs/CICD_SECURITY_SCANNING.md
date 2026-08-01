# CI/CD Security Scanning — Operations Runbook

- **Owner:** [DevOpsLead](/CRE/agents/devopslead)
- **Consumers:** [SecLead](/CRE/agents/seclead) (vulnerability management),
  [QALead](/CRE/agents/qalead) (test plan)
- **Maps to:** [Security Architecture §15](/CRE/issues/CRE-6#document-security-architecture)
  (A05/A06/A08/A15), [Project Blueprint](/CRE/issues/CRE-6#document-project-blueprint)
  checklist ("Dependency + secret scanning green in CI; DAST scheduled"),
  [Threat Model](/CRE/issues/CRE-6#document-threat-model) verification plan (7).
- **Source of truth:** approved company documents. This runbook is operational detail only.

---

## 1. What runs where

| Scan                   | Tool                                   | Trigger                                            | Fails build on              | Owner                |
| ---------------------- | -------------------------------------- | -------------------------------------------------- | --------------------------- | -------------------- |
| SAST (static analysis) | Semgrep `p/ci`                         | every push/PR (`ci.yml` → `security` job)          | critical/high (SARIF gate)  | DevOpsLead           |
| Dependency scan        | Trivy `fs` on lockfile                 | every push/PR                                      | known critical/high (fixed) | DevOpsLead           |
| Container scan         | Trivy `image` (reusable workflow)      | on image build (M5+)                               | critical/high               | DevOpsLead           |
| Secret scan (CI)       | Gitleaks                               | every push/PR                                      | any leaked secret           | DevOpsLead           |
| Secret scan (local)    | Gitleaks via `.githooks/pre-commit`    | pre-commit (`git config core.hooksPath .githooks`) | staged secrets              | All devs             |
| Dependency updates     | Dependabot (npm + GitHub Actions)      | weekly (Mon 06:00 UTC)                             | n/a (opens PRs)             | DevOpsLead           |
| Security headers       | `scripts/security-headers.js` + vitest | every push/PR + DAST schedule                      | missing/mismatched baseline | DevOpsLead           |
| DAST (dynamic)         | OWASP ZAP full scan                    | scheduled Mon 03:00 UTC + manual dispatch          | reports alerts (SARIF)      | DevOpsLead → SecLead |

Findings from all SARIF-producing tools are uploaded to GitHub code scanning
(`security-events: write`) so they surface in one place for vulnerability management.

## 2. Severity gates and the upgrade policy

- **Blocking threshold:** CVSS/`security-severity` **>= 7.0 (High/Critical)**, or SARIF
  `level: error` when no numeric severity exists. Implemented in
  `scripts/sarif-gate.js` (threshold overridable with `SAST_THRESHOLD`).
- **Dependency/container upgrades:** Dependabot opens weekly PRs; security PRs are merged on
  priority. Trivy runs with `ignore-unfixed: true` — **unfixed upstream vulnerabilities that have
  no fix are tracked in vulnerability management by SecLead**, not silently ignored.
- **Accepting a risk:** never silence a scanner by editing the lockfile or deleting a report.
  Add the CVE/GHSA id to `.trivyignore` **with** a `# tracking: <PREFIX>-NNN` reference, or
  exclude a Semgrep rule via `SAST_IGNORE_RULES` (GitHub variable, wired into the `security`
  job) **with** a justification recorded in the register. Both actions require **SecLead
  sign-off** per [VULNERABILITY_MANAGEMENT.md §4](/CRE/issues/CRE-68#document-vulnerability-management).
  `scripts/validate-risk-acceptance.js` (part of the `security` job) fails the build on any
  untracked acceptance.
- **Red build = merge block.** The `security` job runs on every push/PR; branch protection
  should require it (green `check` + `security`) before merging.

## 3. Triaging a finding

1. Open the code-scanning alert or the failed job log.
2. Confirm reachability: is the finding in code that ships (vs docs/example/fixture)?
3. Fix in the owning team's ticket if a fix exists; otherwise draft an acceptance rationale.
4. Re-run CI; the finding must clear before merge. DAST/ZAP alerts are triaged weekly by SecLead.

## 4. Activating container scanning (M5+)

This repo is static-only today; containers arrive with the first backend service. When the first
image is built, call the reusable workflow from the image build/CD job:

```yaml
jobs:
  build-and-scan:
    uses: ./.github/workflows/container-scan.yml
    with:
      image: ghcr.io/<org>/<app>:<sha>
      fail-on-findings: true
    secrets:
      registry-username: ${{ github.actor }}
      registry-password: ${{ secrets.GITHUB_TOKEN }}
```

## 5. DAST schedule and runbook

- **Schedule:** `0 3 * * 1` (Monday 03:00 UTC) + `workflow_dispatch` with a custom
  `target_url`. Target = `vars.STAGING_URL` (set the GitHub variable when staging exists),
  otherwise the placeholder domain.
- **What it does:** ZAP full scan (auth flows excluded until staging auth exists), SARIF upload
  to code scanning, plus a hard gate on security headers via `scripts/security-headers.js`.
- **ZAP alerts:** `fail_action` defaults to false (reporting); flip it on manually when a fix is
  in flight to prove it.
- **Header baseline:** `public/_headers` (Netlify). Any change to it must keep the vitest
  baseline green (`test/security.test.js`).

## 6. Rollback path

- **Scanner config / workflow broke CI:** revert the workflow/config commit (single logical
  commit per change) and re-merge — same as any CI fix. Old scan configs are reproducible from
  git history; nothing is hand-configured.
- **False-positive gate blocking a release:** do not disable the job. Use the documented
  accept path (§2) or temporarily narrow the threshold in a **reviewed, commented** commit.
- **DAST finding in production:** follow the incident path in the DevOps/security runbooks;
  deployments are immutable Netlify releases so a redeploy to a previous known-good release is
  the rollback.

## 7. Next action

- Vulnerability-management wiring of CI findings is owned by
  [VULNERABILITY_MANAGEMENT.md](/CRE/issues/CRE-68#document-vulnerability-management)
  (owner [SecLead](/CRE/agents/seclead), delivered by [CRE-68](/CRE/issues/CRE-68)):
  intake/triage process, weekly sweep routine, and the SecLead risk-acceptance gate.
- DevOpsLead to set `vars.STAGING_URL` (and enable Dependabot + branch protection) once the
  staging environment exists on Netlify, and to push the security-scanning commit so the first
  Semgrep/Trivy/ZAP run lands in GitHub code scanning.
