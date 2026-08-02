# Lighthouse a11y + performance pass — M3 rebrand

- **Issue:** [CRE-35](/CRE/issues/CRE-35) (M3-3 — Site rebrand)
- **Date:** 2026-08-02
- **Tool:** Lighthouse 13.4.1 (headless Chrome), categories `performance` + `accessibility` only
- **Target:** local production build (`vite preview` on `dist/`), all shipped pages

## Results

| Page                  | URL                         | Performance | Accessibility |
| --------------------- | --------------------------- | ----------- | ------------- |
| Home                  | `/`                         | **0.99**    | **1.00**      |
| Design guidelines     | `/design-guidelines.html`   | **0.99**    | **1.00**      |
| Component examples    | `/examples.html`            | **1.00**    | **1.00**      |

## Key performance metrics (home)

- Largest Contentful Paint (LCP): **1.6 s** (score 0.99)
- First Contentful Paint (FCP): **1.6 s** (score 0.94)
- Cumulative Layout Shift (CLS): **0** (score 1.00)
- Total Blocking Time (TBT): **0 ms** (score 1.00)

## Accessibility baseline

Every page scores **1.00** on accessibility. The WCAG 2.1 AA baseline is also enforced
automatically in CI by `test/a11y-components.test.js` (skip link, single `h1`, landmark nav
labels, labeled form controls, focus-visible styles, no color-only state).

## Artifacts

- `docs/lighthouse/home.json`
- `docs/lighthouse/design-guidelines.json`
- `docs/lighthouse/examples.json`

## How to reproduce

```bash
npm run build
npm run preview -- --port 4173 --strictPort
npx lighthouse http://localhost:4173/ \
  --chrome-path="<chrome>" --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility --output=json \
  --output-path=docs/lighthouse/home.json
```
