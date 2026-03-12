# VanX Render Facade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class VanX support to `van-stack/render` so shared app code can import `van` and `vanX` from one framework-owned facade.

**Architecture:** Extend the render environment from a single bound Van runtime to a bound `{ van, vanX }` pair. CSR will bind `vanjs-core` plus real `van-x`; SSR and SSG will bind Mini-Van plus `dummyVanX`, following the official Van fullstack SSR pattern.

**Tech Stack:** Bun, TypeScript, Vitest, Biome, vanjs-core, van-x, mini-van-plate

---

## File Structure

- Modify: `packages/core/src/render.ts`
  - extend the render facade to expose `vanX`
- Modify: `packages/csr/src/render-env.ts`
  - bind client `van` + real `vanX`
- Modify: `packages/ssr/src/render-env.ts`
  - bind server `van` + `dummyVanX`
- Modify: `packages/ssg/src/index.ts` or shared server binding usage if needed
  - keep static generation aligned with SSR binding
- Modify: `package.json`
  - add `van-x`
- Modify: `tests/core/core.test.ts`
  - cover `vanX` facade and runtime binding
- Modify: `README.md`
  - document `import { van, vanX } from "van-stack/render"`
- Modify: `docs/shared-components.md`
  - explain the shared `van` / `vanX` facade
- Modify: `tests/docs-and-demos.test.ts`
  - keep docs aligned with the new public surface

## Chunk 1: Core Render Facade

### Task 1: Add `vanX` to the framework render facade

**Files:**
- Modify: `packages/core/src/render.ts`
- Modify: `tests/core/core.test.ts`

- [ ] **Step 1: Write the failing test**
  - Add core tests that:
    - using `vanX` before binding throws the same clear framework error
    - binding a fake render env makes `vanX` available through the facade
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: FAIL because `vanX` is not exposed yet.
- [ ] **Step 3: Implement the minimal facade change**
  - Extend the bound render environment shape to include both `van` and `vanX`
  - Export `vanX` from `van-stack/render`
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: PASS.

## Chunk 2: Runtime Binding

### Task 2: Bind client and server VanX runtimes

**Files:**
- Modify: `packages/csr/src/render-env.ts`
- Modify: `packages/ssr/src/render-env.ts`
- Modify: `package.json`
- Modify: `tests/core/core.test.ts`

- [ ] **Step 1: Write the failing runtime-binding test**
  - Extend runtime binding tests to assert:
    - CSR binds a defined `vanX`
    - SSR binds a defined server-safe `vanX`
    - SSG still reuses the SSR/server render env
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: FAIL because runtime bindings only provide `van`.
- [ ] **Step 3: Implement the minimal runtime binding**
  - Add the `van-x` dependency
  - Bind real `van-x` in CSR
  - Bind `dummyVanX` and register it in SSR
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: PASS.

## Chunk 3: Docs

### Task 3: Update public docs for the new facade

**Files:**
- Modify: `README.md`
- Modify: `docs/shared-components.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing docs test**
  - Add assertions that README / shared-component docs show `import { van, vanX } from "van-stack/render"` and stop implying `van` is the only shared render surface.
- [ ] **Step 2: Run the focused docs test to verify it fails**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: FAIL because the docs only mention `van`.
- [ ] **Step 3: Update the docs**
  - Document the shared render facade with both `van` and `vanX`
  - Note that SSR uses a server-safe VanX binding under the hood
- [ ] **Step 4: Re-run the focused docs test**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: PASS.

## Chunk 4: Verification

### Task 4: Verify the repo end to end

**Files:**
- No new files expected unless verification exposes gaps

- [ ] **Step 1: Run the full test suite**
  - Run: `bun run test`
  - Expected: PASS.
- [ ] **Step 2: Run formatting and lint checks**
  - Run: `bun run check`
  - Expected: PASS.
- [ ] **Step 3: Run the build**
  - Run: `bun run build`
  - Expected: PASS.
- [ ] **Step 4: Review worktree state**
  - Run: `git status --short`
  - Expected: only the planned VanX render-facade changes and existing unrelated worktree changes are present.
