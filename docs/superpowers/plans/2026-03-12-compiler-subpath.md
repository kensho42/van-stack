# Compiler Subpath Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the compiler as `van-stack/compiler` instead of `@van-stack/compiler`, and remove the separate compiler package identity.

**Architecture:** Keep the compiler implementation in `packages/compiler/src`, but re-export it from the root package as a subpath. Public docs and tests should treat the compiler as part of the main `van-stack` package family.

**Tech Stack:** TypeScript, Bun, Vitest, Markdown

---

## Chunk 1: Add regression coverage

### Task 1: Enforce the new package surface

**Files:**
- Modify: `tests/workspace.test.ts`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing tests**

Require:
- root `package.json` exports `./compiler`
- `packages/compiler/package.json` does not exist
- README uses `van-stack/compiler`
- README does not use `@van-stack/compiler`

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `bun run test tests/workspace.test.ts tests/docs-and-demos.test.ts`
Expected: FAIL because the root export is missing and the README still uses the old package name.

## Chunk 2: Implement the package change

### Task 2: Move the compiler to a root subpath

**Files:**
- Modify: `package.json`
- Modify: `packages/compiler/src/index.ts`
- Delete: `packages/compiler/package.json`

- [ ] **Step 1: Write the minimal implementation**

- add the root `./compiler` export
- update the compiler package name constant
- delete the separate compiler package manifest

- [ ] **Step 2: Run targeted tests**

Run: `bun run test tests/workspace.test.ts tests/docs-and-demos.test.ts`
Expected: PASS

## Chunk 3: Update public guidance

### Task 3: Align the docs

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/2026-03-12-readme-refresh-design.md`
- Modify: `docs/superpowers/plans/2026-03-12-readme-refresh.md`

- [ ] **Step 1: Replace the old package name**

Use `van-stack/compiler` consistently in the active public docs and current design/plan references.

- [ ] **Step 2: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build check succeeds
