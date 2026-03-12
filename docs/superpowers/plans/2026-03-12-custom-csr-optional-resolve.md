# Custom CSR Optional Resolve Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `resolve` optional in CSR `custom` mode so apps can use VanStack for routing only and fetch data at component level.

**Architecture:** Keep the change local to core router types and the CSR router implementation. `custom` mode should default to a no-op resolver, while docs and demos explain that route-level data is optional in this mode.

**Tech Stack:** TypeScript, Vitest, Bun, Biome, Markdown

---

## Chunk 1: Add regression coverage

### Task 1: Prove `custom` mode works without a resolver

**Files:**
- Modify: `tests/csr/router.test.ts`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing tests**

Add:
- a CSR router test that creates `custom` mode without `resolve` and verifies `load()` and `navigate()` still work with `data: undefined`
- a docs test that requires component-level fetching language in the getting-started guide

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test tests/csr/router.test.ts tests/docs-and-demos.test.ts`
Expected: FAIL because `custom` still requires `resolve` and docs do not mention component-level fetching yet.

## Chunk 2: Implement the runtime change

### Task 2: Make `resolve` optional

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/csr/src/router.ts`

- [ ] **Step 1: Write the minimal implementation**

- make `CreateCustomRouterOptions.resolve` optional
- default missing `resolve` to an async function that returns `undefined`

- [ ] **Step 2: Run targeted tests**

Run: `bun run test tests/csr/router.test.ts tests/docs-and-demos.test.ts`
Expected: PASS

## Chunk 3: Update public-facing material

### Task 3: Align README, docs, and demos

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/hydration-modes.md`
- Modify: `docs/loaders-and-actions.md`
- Modify: `docs/demos.md`
- Modify: `demo/csr/README.md`
- Modify: `demo/csr/custom/src/routes/index/page.ts`

- [ ] **Step 1: Update the text**

Document that `custom` mode can use:
- a host-provided resolver
- component-level or hook-level data fetching with no resolver

- [ ] **Step 2: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build check succeeds
