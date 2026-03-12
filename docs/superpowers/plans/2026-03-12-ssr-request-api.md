# SSR Request API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `van-stack/ssr` accept a real `Request` as its primary render input instead of a manual pathname string.

**Architecture:** Keep the route graph unchanged, but derive the current path from `request.url` inside `renderRequest`. Reuse the same API from SSG by constructing synthetic `Request` objects there.

**Tech Stack:** TypeScript, Bun, Vitest, Markdown

---

## Chunk 1: Add regression coverage

### Task 1: Require request-based SSR examples and tests

**Files:**
- Modify: `tests/ssr/render.test.ts`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing tests**

Update the SSR tests to pass `request: new Request(...)` and require the README to show the same request-based usage.

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `bun run test tests/ssr/render.test.ts tests/docs-and-demos.test.ts`
Expected: FAIL because `renderRequest` still expects `pathname`.

## Chunk 2: Implement the API change

### Task 2: Switch SSR and SSG to Request input

**Files:**
- Modify: `packages/ssr/src/render.ts`
- Modify: `packages/ssg/src/build.ts`

- [ ] **Step 1: Write the minimal implementation**

- derive the path from `request.url`
- keep route matching on the pathname
- update bootstrap payload to include the full request path
- make SSG construct `Request` objects internally

- [ ] **Step 2: Run targeted tests**

Run: `bun run test tests/ssr/render.test.ts tests/docs-and-demos.test.ts`
Expected: PASS

## Chunk 3: Update docs

### Task 3: Align public examples

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace pathname-based SSR examples**

Show `renderRequest({ request, routes })` as the documented SSR surface.

- [ ] **Step 2: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build check succeeds
