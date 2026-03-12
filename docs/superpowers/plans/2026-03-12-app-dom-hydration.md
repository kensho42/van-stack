# App DOM Hydration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real DOM hydration for `hydrationPolicy: "app"` routes by introducing route-level `hydrate.ts` modules that use `van.hydrate(...)` on existing SSR DOM before CSR router takeover.

**Architecture:** Keep `page.ts` responsible for SSR/shared markup and add `hydrate.ts` as an explicit client-only DOM hydration module. Extend the compiler and runtime so app routes can discover and invoke `hydrate.ts`, expose `van.hydrate` through `van-stack/render`, and keep the existing `hydrateApp(...)` router handoff flow as the orchestration layer.

**Tech Stack:** TypeScript, Bun, Vitest, Biome, vanjs-core, mini-van-plate, Markdown

---

## Chunk 1: Lock the public contract with tests

### Task 1: Add failing tests for render, compiler, SSR, and CSR hydration behavior

**Files:**
- Modify: `tests/core/core.test.ts`
- Modify: `tests/compiler/fs-routes.test.ts`
- Modify: `tests/ssr/render.test.ts`
- Modify: `tests/csr/hydrate-app.test.ts`

- [ ] **Step 1: Write the failing render-facade test**

Add a test in `tests/core/core.test.ts` that binds a fake Van runtime exposing `hydrate`, then asserts:
- `van.hydrate` exists on `van-stack/render`
- calling it forwards to the bound runtime

- [ ] **Step 2: Write the failing compiler test**

Add coverage in `tests/compiler/fs-routes.test.ts` proving:
- `hydrate.ts` is treated as a reserved route file
- `loadRoutes({ root })` returns a route with `files.hydrate`
- generated manifests include `hydrate: () => import(...)`

- [ ] **Step 3: Write the failing SSR test**

Add a test in `tests/ssr/render.test.ts` for an `app` route that asserts the HTML response contains:
- a stable framework-owned app root marker
- the bootstrap payload
- the page markup inside that root

- [ ] **Step 4: Write the failing CSR hydration tests**

Expand `tests/csr/hydrate-app.test.ts` to require that:
- `hydrateApp(...)` resolves the matched route’s `hydrate.ts`
- it passes `{ root, data, params, path }` into that module
- the route hydrate module can call `van.hydrate(...)`
- later link interception and `popstate` takeover still work

- [ ] **Step 5: Run targeted tests to verify they fail**

Run: `bun run test tests/core/core.test.ts tests/compiler/fs-routes.test.ts tests/ssr/render.test.ts tests/csr/hydrate-app.test.ts`

Expected:
- FAIL because `van-stack/render` does not expose `hydrate`
- FAIL because `hydrate.ts` is not a reserved route module yet
- FAIL because SSR does not emit an app root marker yet
- FAIL because `hydrateApp(...)` does not resolve route `hydrate.ts`

## Chunk 2: Extend the framework surface and route discovery

### Task 2: Add `van.hydrate` and `hydrate.ts` route discovery

**Files:**
- Modify: `packages/core/src/render.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/compiler/src/fs-routes.ts`
- Modify: `packages/compiler/src/manifest.ts`

- [ ] **Step 1: Implement render-facade support**

Update `packages/core/src/render.ts` so `VanLike` and the exported `van` facade include:

```ts
hydrate(dom: Node, fn: (dom: Node) => Node | null | undefined)
```

The implementation should forward directly to the bound runtime.

- [ ] **Step 2: Implement route-file discovery**

Update the reserved route-file kinds to include `"hydrate"` and make the compiler emit `files.hydrate` in both in-memory loaded routes and generated manifests.

- [ ] **Step 3: Run targeted tests**

Run: `bun run test tests/core/core.test.ts tests/compiler/fs-routes.test.ts`

Expected:
- PASS

## Chunk 3: Add SSR app roots and CSR route-level hydration

### Task 3: Wire `hydrate.ts` into SSR and `hydrateApp(...)`

**Files:**
- Modify: `packages/csr/src/hydrate-app.ts`
- Modify: `packages/ssr/src/render.ts`
- Modify: `packages/csr/src/index.ts`

- [ ] **Step 1: Add the SSR app root marker**

Update `packages/ssr/src/render.ts` so page routes using `hydrationPolicy: "app"` wrap the rendered body content in one stable framework-owned root element.

- [ ] **Step 2: Extend `hydrateApp(...)` to run route hydration**

Update `packages/csr/src/hydrate-app.ts` so it:
- finds the framework app root
- resolves the matched route from `routes`
- loads `files.hydrate` when present
- invokes the route hydrate module with `{ root, data, params, path }`
- only then continues with the existing router setup and browser navigation wiring

- [ ] **Step 3: Keep the no-`hydrate.ts` path explicit**

If the matched route has no `hydrate.ts`, continue with router takeover only. Do not fake DOM hydration or mount a second copy of the route.

- [ ] **Step 4: Run targeted tests**

Run: `bun run test tests/ssr/render.test.ts tests/csr/hydrate-app.test.ts`

Expected:
- PASS

## Chunk 4: Document the route contract and hydration model

### Task 4: Update README, docs, and demo guidance

**Files:**
- Modify: `README.md`
- Modify: `docs/hydration-modes.md`
- Modify: `docs/route-conventions.md`
- Modify: `docs/shared-components.md`
- Modify: `docs/demos.md`
- Modify: `demo/ssr-blog/README.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Document `hydrate.ts`**

Update docs to explain:
- `hydrate.ts` is a reserved route module
- it is used for `app` routes that need real DOM hydration
- `page.ts` should emit stable markers for nodes that `hydrate.ts` will bind
- future `islands` can reuse route-level `hydrate.ts` by hydrating multiple marked subroots

- [ ] **Step 2: Add a short code example**

Show a minimal split between:
- `page.ts` rendering marked SSR DOM
- `hydrate.ts` calling `van.hydrate(...)`

- [ ] **Step 3: Run docs regression tests**

Run: `bun run test tests/docs-and-demos.test.ts`

Expected:
- PASS

## Chunk 5: Full verification

### Task 5: Run the full project verification suite

**Files:**
- No code changes in this task

- [ ] **Step 1: Run the full test suite**

Run: `bun run test`

Expected:
- all tests pass

- [ ] **Step 2: Run Biome**

Run: `bun run check`

Expected:
- no lint or formatting errors

- [ ] **Step 3: Run the TypeScript build check**

Run: `bun run build`

Expected:
- typecheck passes with exit code 0

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-03-12-app-dom-hydration-design.md docs/superpowers/plans/2026-03-12-app-dom-hydration.md
git commit -m "docs: plan app dom hydration"
```
