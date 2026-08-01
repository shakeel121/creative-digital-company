# Creative Digital Company — Software Development Roadmap

- **Document type:** Engineering roadmap (zero → production launch)
- **Author:** CTO (Founding Engineer)
- **Version:** 1.0
- **Status:** Draft for board review
- **Date:** 2026-08-02
- **Companion:** [Technology Strategy](/CRE/issues/CRE-6#document-technology-strategy) (stack, standards, TDRs)

---

## 0. How to read this roadmap

- Milestones run **M0 → M8** and cover the full journey from a blank repo to a launched,
  operated product. **No phase is skipped.**
- Milestones M0–M3 are **already delivered** and are marked as such; they are retained here so the
  roadmap is complete from zero.
- "Estimated complexity" uses T-shirt sizing (**S / M / L / XL**) — effort, not calendar time —
  for a team of 1–3 engineers.
- "Dependencies" lists the milestones or external decisions that must land first.
- "Success criteria" is the objective, testable exit condition for each milestone.

---

## M0 — Technical foundation & team setup

**Status:** ✅ Delivered (tracked via [CRE-1](/CRE/issues/CRE-1), [CRE-2](/CRE/issues/CRE-2))

- **Goal:** Establish a runnable, convention-driven engineering environment and the team that owns it.
- **Deliverables:**
  - Hiring plan + first engineer hired (CEO + CTO roles active).
  - Git repository initialized with `main` as default branch.
  - Toolchain scaffolded: Node.js (>=22), npm, Vite, Vitest, ESLint, Prettier.
  - `package.json` scripts (`dev`, `build`, `test`, `lint`, `format`, `verify`), `package-lock.json`.
  - `AGENTS.md` engineering conventions documented.
  - `.gitignore` for dependencies, build output, and local state.
  - Local `npm run verify` gate (lint → test → build) proven.
- **Estimated complexity:** M
- **Dependencies:** None (starting point).
- **Success criteria:** A fresh clone passes `npm ci && npm run verify` on Node 22 and 24 without
  manual steps.

---

## M1 — Company website (MVP)

**Status:** ✅ Delivered (tracked via [CRE-4](/CRE/issues/CRE-4))

- **Goal:** Ship a fast, accessible, branded marketing site as the company's public on-ramp.
- **Deliverables:**
  - Vite + vanilla JS static site (`index.html`, `src/main.js`, `src/style.css`).
  - Semantic, accessible HTML (skip link, nav, sections: Services / Work / Contact).
  - CSS design tokens (`:root`) for brand consistency.
  - Production build to `dist/` with hashed assets.
  - Unit + smoke tests (`test/site.test.js`, `test/smoke.test.js`) covering build, serving,
    content presence, and asset graph.
- **Estimated complexity:** S–M
- **Dependencies:** M0.
- **Success criteria:** `npm run verify` green; built site serves with HTTP 200; key brand content
  and every referenced asset load.

---

## M2 — Hosted remote, CI/CD, and production deploy

**Status:** ✅ Delivered (this issue — [CRE-6](/CRE/issues/CRE-6))

- **Goal:** Put the project on a hosted remote and make CI/CD fully automatic.
- **Deliverables:**
  - GitHub remote `shakeel121/creative-digital-company` as `origin`.
  - `ci.yml`: lint + test + build on Node 22/24 for every push/PR.
  - `deploy.yml`: on push to `main`, build and deploy `dist/` to Netlify production.
  - `netlify.toml` build config; GitHub secrets/variables (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`).
  - Live URL wired into README; manual deploy fallback documented.
  - Technology Strategy + TDR published (companion document).
- **Estimated complexity:** M
- **Dependencies:** M1.
- **Success criteria:** Pushing to `main` runs CI and Deploy workflows to success, and the live site
  at https://creative-digital-company.netlify.app serves the latest build (HTTP 200).

---

## M3 — Branding & design system (Workstream B)

**Status:** 🔄 Next up — **not started**

- **Goal:** Turn the site's ad-hoc styling into a real brand and reusable design system.
- **Deliverables:**
  - Brand identity: name/tagline refinements, color palette, typography scale, logo asset set.
  - Design tokens formalized (colors, spacing, type, radii, shadows) in a dedicated module.
  - Component library (Web Components or plain CSS patterns) for repeatable UI blocks
    (buttons, cards, forms, nav, footer).
  - Accessibility baseline documented and enforced in the component layer.
  - Design guidelines page/section on the site (owned with CMO/UX when hired).
- **Estimated complexity:** M–L
- **Dependencies:** M2; UX designer and CMO engaged (when hired).
- **Success criteria:** Rebranded site ships to production with the design system applied across
  all pages; `npm run verify` green; Lighthouse a11y + performance pass documented.

---

## M4 — Digital products capability (Workstream C)

**Status:** ⏳ Planned — **not started**

- **Goal:** Build the ability to ship client digital products (beyond the marketing site) on the
  established stack.
- **Deliverables:**
  - Product template repo (Vite + vanilla JS / Web Components) with CI + deploy preconfigured.
  - Reusable project-scaffolding script or documented bootstrap checklist.
  - Showcase page on the company site listing product types we deliver.
  - Pilot product: one end-to-end client-facing build to validate the workflow.
- **Estimated complexity:** M–L
- **Dependencies:** M3 (design system); marketing/CMO for positioning.
- **Success criteria:** A second independent product repo ships to its own production URL through
  the same CI/CD path, proving the template is repeatable.

---

## M5 — Backend & data layer (when product requires it)

**Status:** ⏳ Conditional — **not started** (see TDR-006 in Technology Strategy)

- **Goal:** Introduce server-side capability and persistence only when a product genuinely needs it.
- **Deliverables:**
  - Serverless functions on Netlify (forms, webhooks, light API endpoints).
  - Managed Postgres (e.g., Supabase) for persistent relational data.
  - Secrets/environment strategy for function credentials.
  - Structured logging + error capture for functions.
  - Security review of input handling and auth (if any).
- **Estimated complexity:** L
- **Dependencies:** A specific product need (ticket); M4 pilot.
- **Success criteria:** First authenticated, stateful product feature works in production with
  monitored functions and no credentials in source.

---

## M6 — Observability, analytics & security hardening

**Status:** ⏳ Planned — **not started**

- **Goal:** Make the launched properties measurable and auditable, and close known security gaps.
- **Deliverables:**
  - Uptime synthetic checks + deploy-health dashboards.
  - Netlify Analytics for traffic; error tracking (e.g., Sentry) if functions are live.
  - Dependency update cadence + Dependabot-style alerts.
  - Security checklist applied to all repos (no-secrets scan, HTTPS, least-privilege tokens).
  - Incident response runbook (what breaks, who is on call, rollback path).
- **Estimated complexity:** M
- **Dependencies:** M2 (foundation) + M5 if functions exist.
- **Success criteria:** Every production property has uptime + deploy health coverage; a documented
  rollback and incident runbook is tested once.

---

## M7 — Marketing, content & pre-launch readiness

**Status:** ⏳ Planned — **not started**

- **Goal:** Prepare the public-facing story and launch package (owned with CMO/marketing).
- **Deliverables:**
  - Positioning copy, case-study pages, and portfolio content on the site.
  - SEO essentials (metadata, sitemap, structured data, performance budget).
  - Social/outreach assets derived from the design system.
  - Launch checklist covering content, analytics, legal/contact points.
- **Estimated complexity:** M
- **Dependencies:** M3 (brand) and M4 (work) content; CMO engaged.
- **Success criteria:** All site pages are content-complete, indexed (sitemap submitted), and pass the
  performance budget.

---

## M8 — Production launch & post-launch operations

**Status:** ⏳ Final — **not started**

- **Goal:** Declare the company's public product launched and operate it sustainably.
- **Deliverables:**
  - Go/no-go review against all milestone success criteria.
  - Launch window execution (deploy freeze discipline, monitoring watch).
  - Post-launch support loop: bug triage, hotfix path through CI, feature backlog.
  - Adoption of the roadmap's operating cadence (monitoring, updates, reviews).
  - Launch retrospective + roadmap revision.
- **Estimated complexity:** M
- **Dependencies:** M6 and M7.
- **Success criteria:** Live site + first product properties healthy for 14 consecutive days;
  monitoring green; incident runbook exercised; retrospective recorded.

---

## 1. Summary grid

| # | Milestone | Status | Complexity | Depends on |
| - | --------- | ------ | ---------- | ---------- |
| M0 | Technical foundation & team | ✅ Done | M | — |
| M1 | Company website MVP | ✅ Done | S–M | M0 |
| M2 | Hosted remote, CI/CD, deploy | ✅ Done | M | M1 |
| M3 | Branding & design system (B) | 🔄 Next | M–L | M2 |
| M4 | Digital products capability (C) | ⏳ Planned | M–L | M3 |
| M5 | Backend & data layer | ⏳ Conditional | L | M4 + need |
| M6 | Observability & security | ⏳ Planned | M | M2/M5 |
| M7 | Marketing & pre-launch | ⏳ Planned | M | M3/M4 |
| M8 | Production launch & ops | ⏳ Final | M | M6/M7 |

## 2. Sequencing rationale

- **M0 → M2 are already true** and give us a zero-cost, always-deployable baseline.
- **M3 before M4**: a stable brand/design system makes every later deliverable (products,
  marketing, case studies) consistent instead of bespoke.
- **M4 before M5**: prove the product workflow on static output before paying for a backend.
- **M5 is deliberately conditional** (per TDR-006): no server before a product need — keeps cost and
  security surface minimal.
- **M6 before M8**: don't launch what you can't observe or roll back.
- **M7 + M6 both gate M8**: content and operations must be ready together for a credible launch.

## 3. Next action

1. Board adopts this roadmap (approve/request changes).
2. CTO creates implementation issues for **M3** (branding & design system) as the active milestone,
   including tickets for the design-system module, component library, and site rebrand.
3. M3 hand-offs to UX designer/CMO are opened when those roles are hired.
