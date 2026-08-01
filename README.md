# Creative Digital Company — Website

Company website and product surface for Creative Digital Company. A fast, accessible
static site (Vite + vanilla JS) that is the on-ramp for Workstreams B and C.

## Live site

- **Production:** https://creative-digital-company.netlify.app
- **Hosting:** Netlify (deployed from `dist/` via `netlify deploy`)
- **Source repo:** https://github.com/shakeel121/creative-digital-company

## CI/CD

- **CI:** GitHub Actions runs lint + test + build on every push/PR to `main`
  (see `.github/workflows/ci.yml`).
- **Security scans (CI):** SAST (Semgrep), dependency scan (Trivy) and secret scan
  (Gitleaks) run in the `security` job on every push/PR and **fail the build on
  critical/high findings**. SARIF reports are uploaded to GitHub code scanning. See
  `docs/CICD_SECURITY_SCANNING.md` for the runbook.
- **DAST:** a scheduled ZAP scan (Monday 03:00 UTC) runs against staging plus a live
  security-header check (`.github/workflows/dast.yml`).
- **Dependency updates:** Dependabot opens weekly PRs for npm + GitHub Actions
  (`.github/dependabot.yml`).
- **Pre-commit secret scan:** enable locally with
  `git config core.hooksPath .githooks` (and `chmod +x .githooks/pre-commit` on
  Linux/macOS). Scans staged changes with Gitleaks; CI enforces regardless.
- **Deploy:** pushes to `main` are automatically built and deployed to Netlify
  by GitHub Actions (see `.github/workflows/deploy.yml`, `netlify.toml`).
- **Manual deploy** (fallback):
  ```bash
  npm run verify
  netlify deploy --prod --dir dist --site 6ac121cd-83ce-43df-8d10-babe4a92fa70
  ```

## Prerequisites

- Node.js >= 22 (developed on Node 24)
- npm >= 10

## Local development

```bash
npm install       # first time
npm run dev       # start dev server at http://localhost:5173
```

## Local run/verify path

Run the full verification gate before merging any change:

```bash
npm run verify
```

`npm run verify` runs (in order):

1. **Lint** — `npm run lint` (ESLint)
2. **Tests** — `npm run test` (Vitest, includes the smoke tests)
3. **Build** — `npm run build` (production build into `dist/`)

### What the smoke tests cover (`test/smoke.test.js`)

- The production build passes (`vite build`).
- A preview server serves the built site.
- The page loads with HTTP 200 and an HTML content type.
- Key user-facing content is present (brand name, Services/Work/Contact, contact email).
- Every asset referenced by the page (CSS, JS, favicon) loads successfully.

Run just the smoke tests with `npm run smoke`.

### Other useful commands

| Command                | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the dev server (http://localhost:5173)       |
| `npm run build`        | Production build to `dist/`                        |
| `npm run preview`      | Serve the built `dist/` locally                    |
| `npm run lint`         | ESLint over the repo                               |
| `npm run format`       | Auto-format with Prettier                          |
| `npm run format:check` | Verify formatting (used as a gate)                 |
| `npm run smoke`        | Smoke tests only                                   |
| `npm run verify`       | Full gate: lint + tests + build (run before merge) |

## Merge checklist

1. `npm run verify` passes.
2. `npm run format:check` passes (or run `npm run format`).
3. No secrets or credentials in the diff (Gitleaks gates this in CI).
4. No new critical/high SAST/dependency findings (the `security` CI job enforces this).

## Structure

```
index.html            # single-page entry (static site)
src/main.js           # small client script (nav, year, reveal)
src/style.css         # site styles
test/smoke.test.js    # automated verification of the built site
```
