# README Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` into a broader landing page with a guided API tour and current, copyable examples.

**Architecture:** Keep the rewrite focused on the root README and enforce the new shape with docs tests. Examples should mirror the current compiler and runtime APIs, especially `loadRoutes`, `van-stack/render`, CSR runtime modes, and SSR rendering.

**Tech Stack:** Markdown, Vitest, Bun, Biome

---

## Chunk 1: Add regression coverage

### Task 1: Tighten README expectations

**Files:**
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing test**

Require the README to mention:
- `@van-stack/compiler`
- `How It Fits Together`
- `Quick Start`
- `API Tour`
- `mode: "shell"`
- `renderRequest`
- `replace`
- `stack`

- [ ] **Step 2: Run targeted test to verify it fails**

Run: `bun run test tests/docs-and-demos.test.ts`
Expected: FAIL because the current README does not have the new section structure yet.

## Chunk 2: Rewrite the README

### Task 2: Refresh the landing page

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the minimal implementation**

Rewrite the README so it includes:
- updated landing-page structure
- current package surface
- route-module example
- shell/custom/SSR examples that reflect the current APIs
- runtime model summary
- docs and demos index

- [ ] **Step 2: Run targeted test**

Run: `bun run test tests/docs-and-demos.test.ts`
Expected: PASS

## Chunk 3: Full verification

### Task 3: Verify the repo

**Files:**
- No additional file changes expected

- [ ] **Step 1: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build check succeeds
