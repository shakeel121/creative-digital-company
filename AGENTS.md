# AGENTS.md — Engineering conventions (Creative Digital Company)

Guidelines for any engineer or agent working in this repository.

## Toolchain

- **Node.js >= 22** (project targets Node 24), npm for dependency management.
- **Vite** for dev/build, **Vitest** for tests, **ESLint + Prettier** for lint/format.
- No new build tool or framework should be introduced without a ticket and a stated reason.

## Working in the repo

- `npm install` after cloning or changing dependencies. Commit `package-lock.json`.
- Make small, logical commits. Use the imperative mood in commit messages.
- Never commit secrets, credentials, or customer data. `*` in `.gitignore` for any generated
  or local-only files.
- Do not edit generated/build output (`dist/`, `node_modules/`) directly.

## Definition of done

A change is done only when **all** of these pass:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

Run them as a single gate with `npm run check`. CI enforces the same steps.

## Code style

- JavaScript: ES modules, Prettier defaults (semi, single quotes, trailing commas).
- Design tokens live as CSS custom properties in `src/style.css` (`:root`). Reuse them;
  do not hardcode colors/spacing.
- HTML: semantic elements, `lang`, viewport meta, accessible labels, skip-link, and
  focus-visible styles. Every in-page anchor must resolve to an existing `id`.
- JS: no `console.*` in shipped code; DOM queries guard against missing nodes with optional
  chaining or null checks.

## Testing

- Put tests in `test/` as `*.test.js`; keep them fast and dependency-light.
- Extend `test/site.test.js` when the page structure or asset graph changes.
- When adding a feature, add a smoke assertion that would fail if the feature regressed.

## Verification & QA

- For user-facing changes, verify in a browser via `npm run dev` (or `npm run preview`
  after a build) before marking the work done.
- Coordinate browser/user-facing verification with QA or the manager for a reproducible
  test plan when the change is non-trivial.
