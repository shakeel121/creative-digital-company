# Creative Digital Company — Website

Company website and product surface for Creative Digital Company. A fast, accessible
static site (Vite + vanilla JS) that is the on-ramp for Workstreams B and C.

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
3. No secrets or credentials in the diff.

## Structure

```
index.html            # single-page entry (static site)
src/main.js           # small client script (nav, year, reveal)
src/style.css         # site styles
test/smoke.test.js    # automated verification of the built site
```
