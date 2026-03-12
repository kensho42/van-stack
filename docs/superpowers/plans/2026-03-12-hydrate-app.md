# App Hydration Handoff Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `hydrateApp` helper that automatically continues SSR `app` routes as CSR, including bootstrap ingestion and browser navigation wiring.

**Architecture:** Extend the existing CSR router with a subscription surface, then layer a small browser helper on top that reads SSR bootstrap JSON, creates a hydrated router, and wires click and popstate listeners. Keep the helper narrow so apps still own UI mounting while the framework owns hydration handoff.

**Tech Stack:** TypeScript, Bun, Vitest, Markdown

---

## Chunk 1: Lock the behavior with tests

### Task 1: Add failing regression coverage

**Files:**
- Modify: `tests/csr/router.test.ts`
- Create: `tests/csr/hydrate-app.test.ts`

- [ ] **Step 1: Write the failing tests**

Require:
- router subscriptions receive the current hydrated entry immediately
- router subscriptions observe later `load()` and `navigate()` updates
- `hydrateApp` reads SSR bootstrap and creates a hydrated router
- `hydrateApp` intercepts same-origin anchor clicks and handles `popstate`
- `hydrateApp` rejects missing or non-`app` bootstrap payloads

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `bun run test tests/csr/router.test.ts tests/csr/hydrate-app.test.ts`
Expected: FAIL because the router lacks subscriptions and `hydrateApp` does not exist yet.

## Chunk 2: Implement the CSR handoff

### Task 2: Add router subscriptions and app hydration bootstrap

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/csr/src/router.ts`
- Modify: `packages/csr/src/index.ts`
- Create: `packages/csr/src/hydrate-app.ts`

- [ ] **Step 1: Write the minimal implementation**

- expand bootstrap typing to include the SSR bootstrap fields needed by hydration
- add router subscription support
- add `hydrateApp(...)`
- keep the helper testable with injected browser primitives

- [ ] **Step 2: Run targeted tests**

Run: `bun run test tests/csr/router.test.ts tests/csr/hydrate-app.test.ts`
Expected: PASS

## Chunk 3: Update public docs

### Task 3: Document automatic app hydration

**Files:**
- Modify: `README.md`
- Modify: `docs/hydration-modes.md`
- Modify: `docs/getting-started.md`
- Modify: `demo/ssr-blog/README.md`

- [ ] **Step 1: Update docs**

Document:
- `hydrateApp({ routes })` as the normal `app` hydration entrypoint
- what the helper wires automatically
- what app code still owns after hydration

- [ ] **Step 2: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build succeeds
