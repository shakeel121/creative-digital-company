# Creative Digital Company — Technology Strategy

- **Document type:** Technology Strategy + Technology Decision Record (TDR)
- **Author:** CTO (Founding Engineer)
- **Version:** 1.0
- **Status:** Draft for board review
- **Date:** 2026-08-02
- **Scope:** Company-wide technical foundation; applies to the company website today and to Workstreams B & C (branding, design, digital products) as they ramp.

---

## 0. Executive summary

Creative Digital Company is a design and development studio. Our technical foundation must be
simple, fast, accessible, low-cost, and easy for a small team (founding engineer today, more
engineers tomorrow) to operate and extend.

Our strategy is a **pragmatic, standards-first, JavaScript-centric stack**: a static, accessible
marketing site (already live) built with Vite + vanilla JS, hosted on Netlify, with GitHub for
source control and GitHub Actions for CI/CD. Every choice below is justified against four criteria:
**cost, operational simplicity, team fit, and future scalability.**

The long-term direction: keep static-first delivery as the default (fast, cheap, secure, CDN-served),
introduce backend + AI capability as products demand it (serverless functions first, then managed
services), and never adopt a tool without a ticket and a stated reason.

---

## 1. Complete technology stack

### 1.1 Current stack (as of this document)

| Layer            | Technology                           | Version / Notes                          |
| ---------------- | ------------------------------------ | ---------------------------------------- |
| Language         | JavaScript (ES modules)              | Node.js >= 22, target Node 24             |
| Package manager  | npm                                  | `package-lock.json` committed            |
| Build tool       | Vite                                 | v8, dev server + production build        |
| Testing          | Vitest                               | v4, includes smoke tests                 |
| Linting          | ESLint                               | v10, flat config (`eslint.config.js`)    |
| Formatting       | Prettier                             | v3 (`prettier.json`)                     |
| Frontend         | Vanilla JS + semantic HTML + CSS     | No framework; design tokens in `:root`   |
| Version control  | Git on GitHub                        | Repo: `shakeel121/creative-digital-company` |
| CI/CD            | GitHub Actions                       | `ci.yml` (lint+test+build), `deploy.yml` |
| Static hosting   | Netlify                              | Free tier, CDN, HTTPS, preview deploys   |
| Deployment       | Netlify CLI (`netlify deploy --prod`) | Driven by GitHub Actions on push to main |

### 1.2 Planned / conditional additions (adopt when a ticket requires them)

| Layer          | Candidate                          | When to adopt                                            |
| -------------- | ---------------------------------- | -------------------------------------------------------- |
| Frontend       | Web Components (native)            | Reusable interactive widgets beyond one page             |
| Backend        | Netlify Functions (edge/regional)  | First server-side behavior, forms, webhooks              |
| Data           | Managed Postgres (e.g. Supabase)   | First persistent relational data requirement             |
| Object storage | Netlify Blobs / S3                 | User-uploaded assets at scale                            |
| Observability  | Netlify analytics + structured logs| When user-facing traffic needs product analytics        |
| AI            | OpenAI / Anthropic / Gemini APIs   | Content, chat, and tooling features (see §12)            |

---

## 2. Justification of every technology choice

### 2.1 JavaScript / Node.js
- **Why:** one language across frontend, tooling, and future backend. Small team, maximum leverage.
- **Why not alternatives:** introducing Python/Rust/Go now would split the stack without a
  product-driven reason. Adopt only for a specific need (e.g., heavy compute service).

### 2.2 Vite
- **Why:** instant dev server, fast production builds, zero-config for vanilla JS, first-class
  ES module support, tiny output. Actively maintained, huge ecosystem.
- **Alternative considered:** Webpack (over-configured for our needs), Next.js (framework weight not
  justified for a static marketing site).

### 2.3 Vanilla JS + semantic HTML + CSS (no framework)
- **Why:** the site is static and small; a framework adds bundle size, complexity, and churn for no
  user benefit. HTML/CSS/JS are standards, accessible by default, and trivial to maintain.
- **Constraint:** introducing a framework requires a ticket and a stated reason (per `AGENTS.md`).

### 2.4 Vitest
- **Why:** same ecosystem as Vite, zero config, fast, first-class ESM + jsdom support. Our tests are
  fast and dependency-light.
- **Alternative considered:** Jest (more config, slower startup for ESM projects).

### 2.5 ESLint + Prettier
- **Why:** ESLint v10 flat config is the current standard; Prettier removes formatting bikeshedding.
  Both are enforced in CI and in `npm run verify`.
- **Why enforces as one gate:** `npm run check` runs lint → test → build so nothing ships broken.

### 2.6 GitHub + GitHub Actions
- **Why:** free for public repos, ubiquitous, workflow-as-code in the repo, secrets/variables
  management, and our CI runs lint+test+build on Node 22 and 24.
- **Why not GitLab CI / CircleCI:** no operational advantage at this size; GitHub consolidates
  source control + CI in one place.

### 2.7 Netlify
- **Why:** free tier, global CDN, automatic HTTPS, atomic deploys, rollbacks, and it was the
  already-authenticated provider on this machine. Static output is the perfect fit.
- **Why not Vercel:** equivalent for static sites; Netlify chosen because it was available and
  already provisioned. Both are drop-in for our static deployment.
- **Why not GitHub Pages:** no per-site auth/analytics/rollback UI as mature; Netlify chosen for
  workflow fit. (Revisit if hosting cost ever becomes a factor — GitHub Pages remains a $0 option.)

### 2.8 CSS design tokens
- **Why:** brand consistency. Colors/spacing live as CSS custom properties in `src/style.css` `:root`
  and are reused everywhere — no hardcoded values. Enforced by convention and review.

---

## 3. Coding standards

1. **Language & style:** JavaScript ES modules; Prettier defaults (semi, single quotes, trailing
   commas). Run `npm run format:check`; auto-format with `npm run format`.
2. **Lint:** ESLint flat config; zero-warning policy on merged code.
3. **HTML:** semantic elements, `lang`, viewport meta, accessible labels, skip-link, focus-visible
   styles. Every in-page anchor must resolve to an existing `id`.
4. **CSS:** design tokens from `:root`; no hardcoded colors/spacing; responsive + accessible.
5. **JS:** no `console.*` in shipped code; guard DOM queries with optional chaining/null checks.
6. **No secrets:** never commit secrets, credentials, or customer data. Generated/local-only files
   go in `.gitignore`.
7. **Generated output:** never edit `dist/`, `node_modules/` directly.
8. **Dependencies:** commit `package-lock.json`; no new tool/framework without a ticket and reason.
9. **Definition of done:** `npm run lint` AND `npm run test` AND `npm run build` all pass (the
   `npm run check` gate). CI enforces the same steps.
10. **Commits:** small, logical commits; imperative mood; co-author attribution as required.

---

## 4. Architecture principles

1. **Static-first.** Deliver the maximum as static assets on a CDN. Server-side logic only when the
   product requires it. This keeps the site fast, cheap, and secure by default.
2. **Standards over frameworks.** Native platform capabilities first (HTML, CSS, ES modules, Web
   Components). Add abstraction only when the platform is genuinely limiting.
3. **Separation of concerns.** Content/structure (HTML), presentation (CSS), behavior (JS) remain
   separable. Components own their styles when extracted.
4. **Accessibility is not optional.** A11y is a first-class requirement in code review and smoke
   tests, not a polish step.
5. **Progressive enhancement.** Core content works without JS; JS enhances. No client-side rendering
   as a hard dependency for the marketing site.
6. **Small, reviewable units.** Features land as small, logically-committed changes that the
   verification gate can prove.
7. **Boring technology wins.** Prefer mature, widely-adopted tools with predictable behavior over
   novel ones, unless a ticket justifies the novelty.
8. **Everything as code.** CI workflows, deploy config (`netlify.toml`), lint/format config, and
   docs live in the repo so behavior is reproducible and auditable.

---

## 5. Scalability strategy

- **Static-first scaling.** A CDN-served static site scales horizontally with zero server work. Netlify
  handles global distribution and caching automatically.
- **Read vs write.** Reads are served from CDN edge. Writes (forms, etc.) go to serverless functions
  that can scale independently (Netlify Functions) before any always-on server is introduced.
- **Data.** Start with zero persistence. When relational data is needed, adopt managed Postgres
  (Supabase or equivalent) — managed backups, TLS, and autoscaling remove ops burden.
- **Backend path.** Functions-first: no long-lived servers until a workload genuinely requires them.
  This avoids idle cost and security surface while we have few users.
- **Team scaling.** The stack is deliberately conventional so future engineers ramp fast; conventions
  are documented in `AGENTS.md` and enforced by CI.
- **Product scaling (B & C).** As branding/design/digital-product work lands, each new product gets
  its own repo/workflow; the shared stack and conventions keep them consistent and portable.
- **When to revisit.** If traffic/features ever make static-first + functions insufficient, the
  documented next step is a thin managed backend (Postgres + functions), not a monolith.

---

## 6. Security standards

1. **Secrets management.** No secrets in source. CI uses GitHub encrypted secrets
   (`NETLIFY_AUTH_TOKEN`, etc.). Anything exposed in a diff is treated as a security incident and
   rotated immediately.
2. **HTTPS everywhere.** Netlify serves TLS automatically; HSTS-style defaults are enabled at the
   platform level.
3. **Input handling.** Any user input (forms, query params) is validated server-side; no
   `innerHTML` with untrusted content; escape on output.
4. **Dependency hygiene.** `npm ci` with committed lockfile pins the tree; review dependency
   additions; keep toolchain current (Node LTS).
5. **Least privilege.** CI tokens are scoped to the minimum (repo + workflow; deploy token only has
   site-deploy access). Never run CI with a privileged PAT.
6. **Static-site posture.** No dynamic execution on the marketing site reduces the attack surface to
   CDN + deploy tooling. When functions are added, they run in managed sandboxes with timeouts.
7. **Review gates.** Code review plus CI check for lint/tests/build; a human/board approves any
   dependency on broad permissions, new company-wide skills, or timers (governance actions go on
   separate tickets).
8. **Compliance.** Customer data handling, if it ever arrives, follows a separate data-handling
   policy; this strategy defers to that.

---

## 7. Development workflow

1. **Work items.** All work is tracked as Paperclip issues with a clear success condition; the CTO
   owns technical scoping and delegates to engineers as the team grows.
2. **Branch → PR → merge.** Every change goes through a branch, passes CI, and is reviewed before
   merging to `main`.
3. **Local verification.** `npm run install` → develop → run `npm run verify`
   (lint → test → build) before pushing.
4. **CI enforcement.** GitHub Actions `ci.yml` runs lint, test, and build on Node 22 and 24 for every
   push and PR. A red CI blocks merge.
5. **Browser QA.** For user-facing changes, verify via `npm run dev`/`npm run preview`; coordinate a
   reproducible test plan with QA/manager for non-trivial changes.
6. **Deployment.** Pushes to `main` trigger `deploy.yml`, which builds and deploys to Netlify
   production automatically.
7. **Definition of done.** Verification gate green + review approval + (for UX/marketing changes)
   the relevant owner looped in.

---

## 8. Git branching strategy

**Trunk-based development with short-lived feature branches** — the smallest workflow that fits a
small team and continuous deployment.

- **`main`** — always deployable. Protected: CI must pass; requires review.
- **Feature branches** — `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>` forked from
  `main`, merged back via pull request after CI + review.
- **No long-lived release branches** at this stage. `main` is the only long-lived branch; production
  == `main`.
- **Tagging** — version tags (`v0.x.y`) added on notable milestones for traceability.
- **Why not gitflow:** gitflow's `develop`/`release`/`hotfix` branches add ceremony and merge
  overhead that a one-site, one-team company does not need. We adopt gitflow-style `release/*`
  branches only when multiple products/release trains or a formal release process demands it.
- **Rule:** never push directly to `main`; always PR + CI + review.

---

## 9. Testing strategy

**Test pyramid, weighted toward fast, deterministic checks.**

1. **Smoke/e2e-lite (`test/smoke.test.js`).** Production build succeeds; preview server serves the
   built site; key content present; every referenced asset loads. This guards the "does the shipped
   site work" question.
2. **Unit/integration (`test/site.test.js`).** Page structure and asset graph assertions; extend
   whenever page structure or asset references change.
3. **Feature-level tests.** When a feature is added, add at least one assertion that would fail if
   the feature regressed.
4. **Accessibility checks.** Semantic structure and required attributes asserted in tests; manual
   keyboard/screen-reader pass for user-facing changes.
5. **CI gates.** All tests run on every push/PR via `ci.yml`.
6. **Manual/browser QA.** Smoke `npm run dev`/`preview` verification for user-facing changes, with a
   reproducible test plan for non-trivial changes.
7. **Coverage rule.** No threshold metric for its own sake; meaningful assertions over numbers. Keep
   tests fast and dependency-light.

---

## 10. Deployment strategy

**Single-track continuous deployment: `main` → CI → Netlify production.**

1. **CI (`ci.yml`):** lint + test + build on Node 22/24; build artifact uploaded.
2. **Deploy (`deploy.yml`):** on push to `main`, build with Vite and deploy `dist/` to Netlify
   production using `netlify-cli` (auth via GitHub encrypted secret).
3. **`netlify.toml`:** pins build command (`npm run build`) and publish dir (`dist`) for
   reproducibility and CLI-free deployments.
4. **Preview/rollback:** Netlify provides deploy previews and one-click rollbacks to any previous
   production deploy.
5. **Manual fallback:** documented `netlify deploy --prod --dir dist --site <id>` command in README.
6. **Environment policy:** production credentials only in GitHub secrets/Netlify env vars, never in
   the repo.
7. **When products grow:** each product gets its own repo + deploy workflow on the same shared
   stack; `main`-tracked CD stays the default.

---

## 11. Monitoring and logging strategy

**Stage 1 (now — minimal, static):**
- **Uptime/availability:** Netlify CDN status + periodic HTTP 200 check against the live URL.
- **Deploy health:** GitHub Actions run status (`CI` and `Deploy`) — a failed deploy surfaces in CI.
- **Build/asset errors:** smoke tests fail the pipeline before anything ships.

**Stage 2 (when user-facing traffic/functions arrive):**
- **Netlify Analytics** for traffic, top pages, referrers (privacy-friendly, no cookie banners
  required).
- **Structured logs** from serverless functions to a managed aggregator (e.g. Netlify logs first;
   move to a dedicated service only if volume warrants).
- **Error tracking:** a hosted error monitor (e.g. Sentry) for client + function errors.
- **Synthetic checks:** scheduled HTTP checks on key URLs and core flows.

**Principles:** no alerts without owners; log events, not secrets; aggregate before you alert;
start with uptime + deploy health, add product analytics only when there is product to measure.

---

## 12. AI integration strategy

**Where AI helps us today:**
1. **Engineering tooling (active).** AI-assisted development in the CTO/engineering loop for
   implementation, testing, and debugging — with human/board governance on scope, skills, and timers.
2. **Content acceleration.** Drafting copy, campaign assets, and SEO scaffolding for client work —
   always human-reviewed before publishing (loops in CMO/UX when hired).

**Where AI belongs in the product (Workstreams B/C and beyond):**
3. **Product features.** Chat/assistive features, content generation, and personalized experiences
   via managed APIs (OpenAI / Anthropic / Gemini) behind our own backend (functions-first), so keys
   and usage are controlled and auditable.
4. **Client deliverables.** AI-assisted but human-approved deliverables; we do not ship
   unvalidated AI output to clients.

**Governance rules:**
- AI keys are secrets, stored in the hosting platform's env/secrets, never in the repo.
- Every AI-powered user-facing feature gets a safety review (prompt injection, PII, hallucination
  risk) before release.
- Company-wide AI skills, broad permissions, and automated timers are **governance actions** — they
  require a separate ticket and board approval, not a code change.
- Cost visibility: per-feature usage tracked; adopt a provider gate only when spend justifies it.

---

## 13. Technology Decision Record (TDR)

**TDR-001 — Static site generator/stack for the company website**

- **Status:** Accepted
- **Date:** 2026-08-01
- **Context:** Ship a fast, accessible company website as milestone A3; small team; static content.
- **Decision:** Vite + vanilla JS + semantic HTML/CSS; no framework.
- **Alternatives:** Next.js, Webpack+React, hand-written static files.
- **Consequence:** tiny bundle, instant builds, zero runtime framework risk; framework adoption
  deferred until a product needs it (ticket + reason required).

**TDR-002 — Hosting provider**

- **Status:** Accepted
- **Date:** 2026-08-01
- **Context:** Static site needs global CDN, HTTPS, previews, rollbacks, at minimal cost.
- **Decision:** Netlify (free tier; already-authenticated provider).
- **Alternatives:** Vercel, GitHub Pages, Cloudflare Pages.
- **Consequence:** free tier today; GitHub Pages remains a $0 fallback if cost becomes a concern.

**TDR-003 — Version control + CI/CD**

- **Status:** Accepted
- **Date:** 2026-08-01
- **Context:** Need hosted source control and CI that enforces lint/test/build.
- **Decision:** GitHub + GitHub Actions; trunk-based flow; `main` → CD to Netlify.
- **Alternatives:** GitLab CI, CircleCI, Jenkins.
- **Consequence:** consolidated control+CI, workflow-as-code, free for public repos.

**TDR-004 — Testing framework**

- **Status:** Accepted
- **Date:** 2026-08-01
- **Context:** Fast, dependency-light tests in a Vite/ESM project.
- **Decision:** Vitest (+ jsdom for structure tests), smoke tests on the production build.
- **Alternatives:** Jest.
- **Consequence:** zero-config ESM testing; fast CI.

**TDR-005 — Lint/format**

- **Status:** Accepted
- **Date:** 2026-08-01
- **Context:** Consistent code style and static checks, enforced by CI.
- **Decision:** ESLint v10 (flat config) + Prettier; `npm run check` gate.
- **Alternatives:** Biome, StandardJS.
- **Consequence:** conventional, widely-known tooling; format is deterministic.

**TDR-006 — Backend path (adoption pending a product need)**

- **Status:** Proposed (adopt with first server-side ticket)
- **Context:** Marketing site is fully static; no backend yet.
- **Decision:** Netlify Functions first; managed Postgres (e.g., Supabase) when persistent data is
  required.
- **Alternatives:** self-hosted server, serverless on AWS/GCP.
- **Consequence:** functions-scale with demand, no idle servers; revisit if workloads demand
  long-running processes.

**TDR-007 — AI integration**

- **Status:** Proposed (adopt per feature ticket)
- **Context:** AI can accelerate tooling and product features; needs governance and cost control.
- **Decision:** Use managed AI APIs (OpenAI/Anthropic/Gemini) behind our own functions; keys as
  platform secrets; human review for client-facing output.
- **Alternatives:** self-hosted models (rejected: ops cost at our scale).
- **Consequence:** fast iteration with controlled cost; safety review required per feature.

---

## Appendix A — Standard commands

| Command                | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the dev server (http://localhost:5173)       |
| `npm run build`        | Production build to `dist/`                        |
| `npm run preview`      | Serve the built `dist/` locally                    |
| `npm run lint`         | ESLint over the repo                               |
| `npm run format`       | Auto-format with Prettier                          |
| `npm run format:check` | Verify formatting (used as a gate)                 |
| `npm run test`         | Vitest suite                                       |
| `npm run smoke`        | Smoke tests only                                   |
| `npm run check`        | Full gate: lint + test + build                     |
| `npm run verify`       | Alias of `npm run check` (run before merge)        |

## Appendix B — Change policy for this strategy

- **Minor adjustments** (versions, tooling swaps within a documented alternative): CTO approval.
- **Major changes** (framework introduction, hosting migration, new backend/data platform, new AI
  provider with cost): requires a ticket with justification and board approval — this document is
  updated, not silently deviated from.
