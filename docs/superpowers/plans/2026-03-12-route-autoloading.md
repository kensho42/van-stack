# Route Autoloading Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bundler-independent filesystem route autoloading and generated JS manifests so `van-stack` can load routes from `src/routes` without requiring Vite.

**Architecture:** Keep route discovery, normalization, and manifest generation in `van-stack/compiler`. Preserve manual route arrays, but add a generated `.van-stack/routes.generated.ts` path that CSR, SSR, and SSG can all consume. Keep `van-stack/vite` as an optional integration layer only.

**Tech Stack:** Bun, TypeScript, Node filesystem APIs, Biome, Vitest

---

## File Structure

- Modify: `packages/compiler/src/fs-routes.ts`
  - Keep normalization logic focused and reusable.
- Create: `packages/compiler/src/discover-routes.ts`
  - Walk `src/routes` and return discovered file paths.
- Create: `packages/compiler/src/manifest.ts`
  - Build and optionally write the JS manifest.
- Modify: `packages/compiler/src/index.ts`
  - Export discovery and manifest helpers.
- Modify: `tests/compiler/fs-routes.test.ts`
  - Cover discovery and manifest generation.
- Modify: `README.md`
  - Document route autoloading and generated manifests.
- Modify: `docs/getting-started.md`
  - Show the default filesystem path and generated manifest.
- Modify: `docs/vite.md`
  - Clarify that Vite is optional and only adds DX.
- Modify: `docs/route-conventions.md`
  - Mention the generated manifest and the default `src/routes` discovery root.
- Modify: `docs/demos.md`
  - Note which demos would consume generated manifests.

## Chunk 1: Discovery

### Task 1: Add filesystem route discovery

**Files:**
- Create: `packages/compiler/src/discover-routes.ts`
- Modify: `packages/compiler/src/index.ts`
- Modify: `tests/compiler/fs-routes.test.ts`

- [ ] **Step 1: Write the failing discovery test**
  - Add a test that creates a temporary `src/routes` tree, runs discovery, and expects reserved route files to be returned while `_components` helpers and non-reserved files are ignored.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/compiler/fs-routes.test.ts`
  - Expected: FAIL because `discoverRoutes` does not exist yet.
- [ ] **Step 3: Implement `discoverRoutes`**
  - Walk the given root recursively using Node filesystem APIs.
  - Return discovered file paths in a stable sorted order.
  - Filter down to reserved route filenames only.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/compiler/fs-routes.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/discover-routes.ts packages/compiler/src/index.ts tests/compiler/fs-routes.test.ts
git commit -m "feat: discover filesystem routes"
```

## Chunk 2: JS Manifest Generation

### Task 2: Generate an in-memory JS route manifest

**Files:**
- Create: `packages/compiler/src/manifest.ts`
- Modify: `packages/compiler/src/index.ts`
- Modify: `tests/compiler/fs-routes.test.ts`

- [ ] **Step 1: Write the failing manifest test**
  - Add a test that feeds normalized routes into manifest generation and expects lazy import slots for `page`, `loader`, `meta`, and layout modules.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/compiler/fs-routes.test.ts`
  - Expected: FAIL because the manifest generator does not exist yet.
- [ ] **Step 3: Implement manifest generation**
  - Add `buildRouteManifest` that converts normalized routes into a JS manifest string or object representation suitable for writing to disk.
  - Keep the output focused on route IDs, paths, file slots, and layout chains.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/compiler/fs-routes.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/manifest.ts packages/compiler/src/index.ts tests/compiler/fs-routes.test.ts
git commit -m "feat: build route js manifests"
```

### Task 3: Write the generated manifest to `.van-stack/routes.generated.ts`

**Files:**
- Modify: `packages/compiler/src/manifest.ts`
- Modify: `tests/compiler/fs-routes.test.ts`

- [ ] **Step 1: Write the failing output test**
  - Add a test that writes a manifest for a temporary app and asserts `.van-stack/routes.generated.ts` is created with the expected route entries.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/compiler/fs-routes.test.ts`
  - Expected: FAIL because `writeRouteManifest` does not exist yet.
- [ ] **Step 3: Implement manifest writing**
  - Add `writeRouteManifest({ root, outFile })` and ensure the output directory is created when missing.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/compiler/fs-routes.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/manifest.ts tests/compiler/fs-routes.test.ts
git commit -m "feat: write generated route manifests"
```

## Chunk 3: Documentation

### Task 4: Document autoloading and the generated manifest

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/vite.md`
- Modify: `docs/route-conventions.md`
- Modify: `docs/demos.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing docs test**
  - Add assertions that the docs mention `src/routes` discovery, `.van-stack/routes.generated.ts`, and that Vite is optional for route autoloading.
- [ ] **Step 2: Run the focused docs test to verify it fails**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: FAIL because the docs do not mention the generated manifest yet.
- [ ] **Step 3: Update the docs**
  - Explain the default route autoloading path and when apps still need manual routes.
  - Clarify that Vite improves DX but does not own route discovery.
- [ ] **Step 4: Re-run the focused docs test**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add README.md docs/getting-started.md docs/vite.md docs/route-conventions.md docs/demos.md tests/docs-and-demos.test.ts
git commit -m "docs: explain route autoloading"
```

## Chunk 4: Verification

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
  - Expected: only the planned compiler and docs changes are present.
- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/fs-routes.ts packages/compiler/src/discover-routes.ts packages/compiler/src/manifest.ts packages/compiler/src/index.ts README.md docs/getting-started.md docs/vite.md docs/route-conventions.md docs/demos.md tests/compiler/fs-routes.test.ts tests/docs-and-demos.test.ts
git commit -m "feat: autoload filesystem routes"
```
