# Route Handlers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `route.ts` for raw responses and make SSR return real `Response` objects for both HTML and non-HTML routes.

**Architecture:** Extend the existing reserved-file compiler path with `route.ts`, then branch in SSR between raw route handlers and page-document rendering. Keep SSG consuming SSR internally, but continue exposing HTML strings in its build output.

**Tech Stack:** TypeScript, Bun, Vitest, Markdown

---

## Chunk 1: Add regression coverage

### Task 1: Require route-handler and Response support

**Files:**
- Modify: `tests/compiler/fs-routes.test.ts`
- Modify: `tests/ssr/render.test.ts`
- Modify: `tests/ssg/build.test.ts`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing tests**

Require:
- compiler recognition of `route.ts`
- SSR document responses to expose real `Response` headers/body
- SSR raw routes such as `robots.txt`
- README mention of `route.ts` and `robots.txt`

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `bun run test tests/compiler/fs-routes.test.ts tests/ssr/render.test.ts tests/ssg/build.test.ts tests/docs-and-demos.test.ts`
Expected: FAIL because the compiler and SSR runtime do not support `route.ts` yet.

## Chunk 2: Implement the runtime change

### Task 2: Add `route.ts` and unify SSR output

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/compiler/src/fs-routes.ts`
- Modify: `packages/compiler/src/manifest.ts`
- Modify: `packages/ssr/src/render.ts`
- Modify: `packages/ssg/src/build.ts`

- [ ] **Step 1: Write the minimal implementation**

- add `route` to reserved route file kinds
- include it in compiler manifests
- make SSR return `Response`
- let `route.ts` short-circuit with raw responses
- let SSG read `response.text()` and keep returning `{ path, html }`

- [ ] **Step 2: Run targeted tests**

Run: `bun run test tests/compiler/fs-routes.test.ts tests/ssr/render.test.ts tests/ssg/build.test.ts tests/docs-and-demos.test.ts`
Expected: PASS

## Chunk 3: Update docs

### Task 3: Align public documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/route-conventions.md`
- Modify: `docs/loaders-and-actions.md`

- [ ] **Step 1: Update docs**

Document `route.ts` for:
- `robots.txt`
- `sitemap.xml`
- feeds
- proxy endpoints
- webhooks

- [ ] **Step 2: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build check succeeds
