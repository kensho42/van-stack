# Render Facade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a framework-level Van render facade and rewrite demos to use it instead of raw HTML strings or direct Van runtime imports.

**Architecture:** Create a minimal `van-stack/render` subpath that exposes a shared `van` facade plus binding helpers. CSR, SSR, and SSG bind concrete Van implementations behind that facade. Rewrite demo route files to consume the framework facade and split CSR demo coverage into `hydrated`, `shell`, and `custom`.

**Tech Stack:** Bun, TypeScript, Biome, Vitest, vanjs-core, mini-van-plate

---

## File Structure

- Create: `packages/core/src/render.ts`
  - render facade and environment binding helpers
- Modify: `packages/core/src/index.ts`
  - export render helpers if needed for internal use
- Modify: `package.json`
  - add `./render` export and required Van dependencies
- Modify: `packages/csr/src/index.ts`
  - bind the client Van runtime
- Modify: `packages/ssr/src/index.ts`
  - bind the server Van runtime or expose a binding helper for SSR usage
- Modify: `packages/ssg/src/index.ts`
  - reuse the server binding path
- Modify: `tests/core/core.test.ts`
  - cover render facade behavior
- Modify: `tests/docs-and-demos.test.ts`
  - assert demos import `van-stack/render` and stop returning raw HTML strings
- Modify or Add: demo route files under `demo/csr`, `demo/ssr-blog`, `demo/ssg-site`, `demo/adaptive-nav`
  - rewrite to Van tags via the framework facade
- Modify: `README.md`
  - update examples to use `van-stack/render`
- Modify: `docs/shared-components.md`
  - explain the new facade
- Modify: `docs/demos.md`
  - document the CSR demo split and framework-level render import
- Modify: demo READMEs
  - explain the runtime mode and render facade used in each demo

## Chunk 1: Render Facade

### Task 1: Add `van-stack/render`

**Files:**
- Create: `packages/core/src/render.ts`
- Modify: `package.json`
- Modify: `tests/core/core.test.ts`

- [ ] **Step 1: Write the failing render-facade test**
  - Add tests that:
    - importing the facade exposes `van`
    - calling facade methods before binding throws a clear error
    - binding a fake Van implementation makes `van.tags`, `van.state`, and `van.derive` available
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: FAIL because `van-stack/render` does not exist yet.
- [ ] **Step 3: Implement the render facade**
  - Add `packages/core/src/render.ts` with `van`, `bindRenderEnv`, and `getRenderEnv`.
  - Export the new subpath from the root package.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/core/src/render.ts package.json tests/core/core.test.ts
git commit -m "feat: add render facade"
```

## Chunk 2: Runtime Binding

### Task 2: Bind concrete Van runtimes behind the facade

**Files:**
- Modify: `packages/csr/src/index.ts`
- Modify: `packages/ssr/src/index.ts`
- Modify: `packages/ssg/src/index.ts`
- Modify: `tests/core/core.test.ts`

- [ ] **Step 1: Write the failing runtime-binding test**
  - Add a test that proves the CSR path can bind a client implementation and the SSR/SSG path can bind a server implementation through the same facade.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: FAIL because runtime binding hooks are not wired yet.
- [ ] **Step 3: Implement runtime binding**
  - Add the concrete Van dependencies.
  - Bind the client runtime in CSR.
  - Bind the server runtime in SSR and reuse that path in SSG.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/csr/src/index.ts packages/ssr/src/index.ts packages/ssg/src/index.ts package.json tests/core/core.test.ts
git commit -m "feat: bind runtimes behind render facade"
```

## Chunk 3: Demo Conversion

### Task 3: Rewrite demos to use `van-stack/render`

**Files:**
- Modify or Add: `demo/csr/**`
- Modify: `demo/ssr-blog/src/routes/posts/[slug]/page.ts`
- Modify: `demo/ssg-site/src/routes/index/page.ts`
- Modify: `demo/adaptive-nav/src/routes/index/layout.ts`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing demo test**
  - Add assertions that demo route files import `van-stack/render`, use Van tags, and no longer return raw HTML strings.
  - Add assertions that CSR demos cover `hydrated`, `shell`, and `custom`.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: FAIL because the demos still return strings and CSR coverage is too coarse.
- [ ] **Step 3: Rewrite the demos**
  - Convert the existing demo route files to Van tags via the render facade.
  - Split CSR coverage into the three runtime modes, either by new files or by explicit demo structure.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add demo tests/docs-and-demos.test.ts
git commit -m "feat: rewrite demos with render facade"
```

## Chunk 4: Docs

### Task 4: Update framework docs and README

**Files:**
- Modify: `README.md`
- Modify: `docs/shared-components.md`
- Modify: `docs/demos.md`
- Modify: demo README files
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing docs test**
  - Add assertions that the docs reference `van-stack/render` and no longer imply raw HTML string demos.
- [ ] **Step 2: Run the focused docs test to verify it fails**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: FAIL because the docs still show older examples.
- [ ] **Step 3: Update docs**
  - Make the README and guides show the render facade as the public authoring model.
  - Document the CSR demo split and framework-owned Van abstraction.
- [ ] **Step 4: Re-run the focused docs test**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add README.md docs/shared-components.md docs/demos.md demo/*/README.md tests/docs-and-demos.test.ts
git commit -m "docs: explain render facade"
```

## Chunk 5: Verification

### Task 5: Verify the repo end to end

**Files:**
- No additional files expected unless verification exposes gaps

- [ ] **Step 1: Run the full test suite**
  - Run: `bun run test`
  - Expected: PASS.
- [ ] **Step 2: Run formatting and lint checks**
  - Run: `bun run check`
  - Expected: PASS.
- [ ] **Step 3: Run the build**
  - Run: `bun run build`
  - Expected: PASS.
- [ ] **Step 4: Review the final worktree state**
  - Run: `git status --short`
  - Expected: only the planned render-facade, demo, and docs changes are present.
- [ ] **Step 5: Commit**

```bash
git add package.json packages/core/src/render.ts packages/core/src/index.ts packages/csr/src/index.ts packages/ssr/src/index.ts packages/ssg/src/index.ts demo README.md docs/shared-components.md docs/demos.md tests/core/core.test.ts tests/docs-and-demos.test.ts
git commit -m "feat: add shared render facade"
```
