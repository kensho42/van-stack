# SSG Static Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deployable SSG export path that writes HTML routes, raw `route.ts` outputs, and copied asset files/directories to a static output tree.

**Architecture:** Keep `buildStaticRoutes(...)` as the in-memory SSG primitive, but broaden its output to typed static artifacts. Add `exportStaticSite(...)` as an explicit filesystem writer in `packages/ssg` so route expansion, SSR-backed rendering, and output emission stay in the SSG layer instead of leaking into the compiler.

**Tech Stack:** Bun, TypeScript, Vitest, Biome, `van-stack/ssg`, `van-stack/ssr`, `van-stack/compiler`

---

### Task 1: Define the failing SSG export contract

**Files:**
- Modify: `tests/ssg/build.test.ts`

- [ ] **Step 1: Write failing tests for typed SSG artifacts**

Add tests that expect `buildStaticRoutes(...)` to return enough metadata to distinguish HTML document output from raw `route.ts` output.

- [ ] **Step 2: Write failing tests for filesystem export**

Add tests for:
- `/` -> `index.html`
- `/about` -> `about/index.html`
- `/robots.txt` raw output
- dynamic `route.ts` output through `entries.ts`
- asset file copy
- asset directory copy
- path collision failure

- [ ] **Step 3: Run the focused test file and verify it fails**

Run: `bun test tests/ssg/build.test.ts`

Expected: FAIL because `exportStaticSite(...)` and the broader artifact model do not exist yet.

### Task 2: Implement the artifact model and export writer

**Files:**
- Modify: `packages/ssg/src/build.ts`
- Modify: `packages/ssg/src/index.ts`

- [ ] **Step 1: Add typed SSG artifact definitions**

Define explicit exported types for HTML and raw route outputs.

- [ ] **Step 2: Refactor `buildStaticRoutes(...)`**

Update route expansion so it can emit:
- HTML artifacts for `page.ts` routes
- raw artifacts for `route.ts` routes

Reuse `renderRequest(...)` for route execution so SSR and SSG stay aligned.

- [ ] **Step 3: Add route-to-file mapping helpers**

Implement deterministic output path helpers for:
- `index.html`
- nested `index.html`
- literal raw file paths

- [ ] **Step 4: Add `exportStaticSite(...)`**

Write artifacts into `outDir`, copy explicit asset inputs, and detect path collisions before writing.

- [ ] **Step 5: Run the focused SSG tests**

Run: `bun test tests/ssg/build.test.ts`

Expected: PASS

### Task 3: Document the public API

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/demos.md`
- Modify: `docs/bun.md`
- Modify: `demo/ssg-site/README.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Extend docs assertions first**

Add failing docs coverage for:
- `exportStaticSite`
- static output for generic web servers
- raw `route.ts` export support

- [ ] **Step 2: Update public docs**

Document:
- when to use `buildStaticRoutes(...)`
- when to use `exportStaticSite(...)`
- how assets are copied
- what static hosts can and cannot preserve

- [ ] **Step 3: Run docs coverage**

Run: `bun test tests/docs-and-demos.test.ts`

Expected: PASS

### Task 4: Full verification

**Files:**
- Verify existing modified files only

- [ ] **Step 1: Run full tests**

Run: `bun run test`

- [ ] **Step 2: Run formatter/lint checks**

Run: `bun run check`

- [ ] **Step 3: Run type checks**

Run: `bun run build`

